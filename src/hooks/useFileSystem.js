import { useState, useEffect, useCallback, useRef } from 'react';
import { getLanguageFromExtension } from '../utils/languages';

/**
 * Custom hook for managing file system
 * Handles file CRUD operations and IndexedDB persistence
 * @returns {Object} File system state and methods
 */
export function useFileSystem() {
  const [files, setFiles] = useState({
    'main.js': {
      name: 'main.js',
      content: '// Welcome to SouthStack IDE\n// An offline-first AI-powered development environment\n\nfunction hello() {\n  console.log("Hello from SouthStack!");\n  return "Hello World!";\n}\n\nconst result = hello();\nconsole.log(result);',
      language: 'javascript',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  });

  const [currentFile, setCurrentFile] = useState('main.js');
  const [db, setDb] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimersRef = useRef(new Map());

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open('SouthStackDB', 1);

        request.onerror = () => {
          console.error('❌ Failed to open IndexedDB');
        };

        request.onsuccess = (event) => {
          const database = event.target.result;
          setDb(database);
          console.log('✅ IndexedDB initialized');
          loadFilesFromDB(database);
        };

        request.onupgradeneeded = (event) => {
          const database = event.target.result;
          if (!database.objectStoreNames.contains('files')) {
            database.createObjectStore('files', { keyPath: 'name' });
            console.log('📦 Created files object store');
          }
        };
      } catch (error) {
        console.error('❌ IndexedDB initialization error:', error);
      }
    };

    initDB();
  }, []);

  // Load files from IndexedDB
  const loadFilesFromDB = async (database) => {
    try {
      const transaction = database.transaction(['files'], 'readonly');
      const objectStore = transaction.objectStore('files');
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const savedFiles = request.result;
        if (savedFiles.length > 0) {
          const filesObj = {};
          savedFiles.forEach(file => {
            filesObj[file.name] = file;
          });
          setFiles(filesObj);
          const lastFile = localStorage.getItem('southstack_last_file');
          if (lastFile && filesObj[lastFile]) {
            setCurrentFile(lastFile);
          }
          console.log(`📂 Loaded ${savedFiles.length} files from IndexedDB`);
        }
      };

      request.onerror = () => {
        console.error('❌ Failed to load files from IndexedDB');
      };
    } catch (error) {
      console.error('❌ Error loading files:', error);
    }
  };

  // Save file to IndexedDB
  const saveFileToDB = useCallback((file) => {
    if (!db) return;

    try {
      const transaction = db.transaction(['files'], 'readwrite');
      const objectStore = transaction.objectStore('files');
      objectStore.put(file);
      
      transaction.oncomplete = () => {
        console.log(`💾 Saved ${file.name} to IndexedDB`);
      };
    } catch (error) {
      console.error('❌ Error saving file:', error);
    }
  }, [db]);

  const saveNow = useCallback((file) => {
    saveFileToDB(file);
    setLastSavedAt(Date.now());
    setIsSaving(false);
  }, [saveFileToDB]);

  const scheduleSave = useCallback((file) => {
    setIsSaving(true);
    const existingTimer = saveTimersRef.current.get(file.name);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      saveNow(file);
      saveTimersRef.current.delete(file.name);
    }, 500);

    saveTimersRef.current.set(file.name, timer);
  }, [saveNow]);

  // Delete file from IndexedDB
  const deleteFileFromDB = useCallback((fileName) => {
    if (!db) return;

    try {
      const transaction = db.transaction(['files'], 'readwrite');
      const objectStore = transaction.objectStore('files');
      objectStore.delete(fileName);
      
      transaction.oncomplete = () => {
        console.log(`🗑️ Deleted ${fileName} from IndexedDB`);
      };
    } catch (error) {
      console.error('❌ Error deleting file:', error);
    }
  }, [db]);

  // Get language from file extension
  const getLanguageFromFileExtension = (fileName) => {
    return getLanguageFromExtension(fileName).id;
  };

  // Create new file
  const createFile = useCallback((fileName, content = '') => {
    const newFile = {
      name: fileName,
      content,
      language: getLanguageFromFileExtension(fileName),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setFiles(prev => ({
      ...prev,
      [fileName]: newFile,
    }));

    saveNow(newFile);
    setCurrentFile(fileName);
    localStorage.setItem('southstack_last_file', fileName);
    
    console.log(`📄 Created file: ${fileName}`);
    return newFile;
  }, [saveFileToDB]);

  // Update file content
  const updateFile = useCallback((fileName, content) => {
    setFiles(prev => {
      const updatedFile = {
        ...prev[fileName],
        content,
        updatedAt: Date.now(),
      };

      scheduleSave(updatedFile);
      
      return {
        ...prev,
        [fileName]: updatedFile,
      };
    });
  }, [scheduleSave]);

  // Delete file
  const deleteFile = useCallback((fileName) => {
    if (Object.keys(files).length === 1) {
      console.warn('⚠️ Cannot delete the last file');
      return false;
    }

    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fileName];
      return newFiles;
    });

    deleteFileFromDB(fileName);

    // Switch to another file if current file is deleted
    if (currentFile === fileName) {
      const remainingFiles = Object.keys(files).filter(f => f !== fileName);
      if (remainingFiles.length > 0) {
        setCurrentFile(remainingFiles[0]);
        localStorage.setItem('southstack_last_file', remainingFiles[0]);
      }
    }

    console.log(`🗑️ Deleted file: ${fileName}`);
    return true;
  }, [files, currentFile, deleteFileFromDB]);

  // Rename file
  const renameFile = useCallback((oldName, newName) => {
    if (files[newName]) {
      console.warn('⚠️ File already exists');
      return false;
    }

    const file = files[oldName];
    const renamedFile = {
      ...file,
      name: newName,
      language: getLanguageFromExtension(newName),
      updatedAt: Date.now(),
    };

    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[oldName];
      newFiles[newName] = renamedFile;
      return newFiles;
    });

    deleteFileFromDB(oldName);
    saveNow(renamedFile);

    if (currentFile === oldName) {
      setCurrentFile(newName);
      localStorage.setItem('southstack_last_file', newName);
    }

    console.log(`✏️ Renamed ${oldName} to ${newName}`);
    return true;
  }, [files, currentFile, saveFileToDB, deleteFileFromDB]);

  // Get current file
  const getCurrentFile = useCallback(() => {
    return files[currentFile];
  }, [files, currentFile]);

  // Get all file names
  const getFileNames = useCallback(() => {
    return Object.keys(files).sort();
  }, [files]);

  // Change file language
  const changeFileLanguage = useCallback((fileName, languageId) => {
    setFiles(prev => {
      const updatedFile = {
        ...prev[fileName],
        language: languageId,
        updatedAt: Date.now(),
      };

      scheduleSave(updatedFile);
      
      return {
        ...prev,
        [fileName]: updatedFile,
      };
    });
  }, [scheduleSave]);

  useEffect(() => {
    if (currentFile) {
      localStorage.setItem('southstack_last_file', currentFile);
    }
  }, [currentFile]);

  return {
    files,
    currentFile,
    setCurrentFile,
    createFile,
    updateFile,
    deleteFile,
    renameFile,
    changeFileLanguage,
    getCurrentFile,
    getFileNames,
    lastSavedAt,
    isSaving,
  };
}
