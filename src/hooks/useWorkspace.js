import { useState, useEffect, useCallback } from 'react';
import { getLanguageFromExtension } from '../utils/languages';

/**
 * Custom hook for managing workspaces (multi-project support)
 * Each workspace contains its own set of files and state
 * @returns {Object} Workspace state and methods
 */
export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState({});
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('default');
  const [db, setDb] = useState(null);

  // Initialize IndexedDB with workspace support
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open('SouthStackDB', 2); // Increment version

        request.onerror = () => {
          console.error('❌ Failed to open IndexedDB');
        };

        request.onsuccess = (event) => {
          const database = event.target.result;
          setDb(database);
          console.log('✅ IndexedDB initialized with workspace support');
          loadWorkspacesFromDB(database);
        };

        request.onupgradeneeded = (event) => {
          const database = event.target.result;
          
          // Create workspaces store if it doesn't exist
          if (!database.objectStoreNames.contains('workspaces')) {
            const workspaceStore = database.createObjectStore('workspaces', { keyPath: 'id' });
            workspaceStore.createIndex('name', 'name', { unique: true });
            console.log('📦 Created workspaces object store');
          }

          // Keep legacy files store for migration
          if (!database.objectStoreNames.contains('files')) {
            database.createObjectStore('files', { keyPath: 'name' });
            console.log('📦 Created files object store (legacy)');
          }

          // Migrate existing files to default workspace
          if (event.oldVersion === 1) {
            console.log('🔄 Migrating files to workspace structure...');
            migrateLegacyFiles(event.target.transaction);
          }
        };
      } catch (error) {
        console.error('❌ IndexedDB initialization error:', error);
      }
    };

    initDB();
  }, []);

  // Migrate legacy files to workspace structure
  const migrateLegacyFiles = async (transaction) => {
    try {
      const filesStore = transaction.objectStore('files');
      const workspacesStore = transaction.objectStore('workspaces');
      
      const filesRequest = filesStore.getAll();
      
      filesRequest.onsuccess = () => {
        const legacyFiles = filesRequest.result;
        
        if (legacyFiles.length > 0) {
          const defaultWorkspace = {
            id: 'default',
            name: 'Default Project',
            files: {},
            currentFile: legacyFiles[0]?.name || 'main.js',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          legacyFiles.forEach(file => {
            defaultWorkspace.files[file.name] = file;
          });

          workspacesStore.put(defaultWorkspace);
          console.log(`✅ Migrated ${legacyFiles.length} files to default workspace`);
        }
      };
    } catch (error) {
      console.error('❌ Migration error:', error);
    }
  };

  // Load workspaces from IndexedDB
  const loadWorkspacesFromDB = async (database) => {
    try {
      const transaction = database.transaction(['workspaces'], 'readonly');
      const objectStore = transaction.objectStore('workspaces');
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const savedWorkspaces = request.result;
        
        if (savedWorkspaces.length > 0) {
          const workspacesObj = {};
          savedWorkspaces.forEach(workspace => {
            workspacesObj[workspace.id] = workspace;
          });
          
          setWorkspaces(workspacesObj);
          
          // Restore last workspace
          const lastWorkspace = localStorage.getItem('southstack_current_workspace');
          if (lastWorkspace && workspacesObj[lastWorkspace]) {
            setCurrentWorkspaceId(lastWorkspace);
          } else {
            setCurrentWorkspaceId(savedWorkspaces[0].id);
          }
          
          console.log(`📂 Loaded ${savedWorkspaces.length} workspaces from IndexedDB`);
        } else {
          // Create default workspace if none exist
          createDefaultWorkspace(database);
        }
      };

      request.onerror = () => {
        console.error('❌ Failed to load workspaces from IndexedDB');
        createDefaultWorkspace(database);
      };
    } catch (error) {
      console.error('❌ Error loading workspaces:', error);
    }
  };

  // Create default workspace
  const createDefaultWorkspace = useCallback((database) => {
    const defaultWorkspace = {
      id: 'default',
      name: 'Default Project',
      files: {
        'main.js': {
          name: 'main.js',
          content: '// Welcome to SouthStack IDE\n// An offline-first AI-powered development environment\n\nfunction hello() {\n  console.log("Hello from SouthStack!");\n  return "Hello World!";\n}\n\nconst result = hello();\nconsole.log(result);',
          language: 'javascript',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
      currentFile: 'main.js',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setWorkspaces({ [defaultWorkspace.id]: defaultWorkspace });
    setCurrentWorkspaceId(defaultWorkspace.id);

    // Save to DB
    if (database) {
      const transaction = database.transaction(['workspaces'], 'readwrite');
      const objectStore = transaction.objectStore('workspaces');
      objectStore.put(defaultWorkspace);
    }

    console.log('✅ Created default workspace');
  }, []);

  // Save workspace to IndexedDB
  const saveWorkspaceToDB = useCallback((workspace) => {
    if (!db) return;

    try {
      const transaction = db.transaction(['workspaces'], 'readwrite');
      const objectStore = transaction.objectStore('workspaces');
      objectStore.put(workspace);
      
      transaction.oncomplete = () => {
        console.log(`💾 Saved workspace "${workspace.name}" to IndexedDB`);
      };
    } catch (error) {
      console.error('❌ Error saving workspace:', error);
    }
  }, [db]);

  // Create new workspace
  const createWorkspace = useCallback((name) => {
    const id = `workspace_${Date.now()}`;
    const newWorkspace = {
      id,
      name,
      files: {
        'main.js': {
          name: 'main.js',
          content: `// ${name}\n// New project workspace\n\nconsole.log("Welcome to ${name}!");`,
          language: 'javascript',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
      currentFile: 'main.js',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setWorkspaces(prev => ({
      ...prev,
      [id]: newWorkspace,
    }));

    saveWorkspaceToDB(newWorkspace);
    setCurrentWorkspaceId(id);
    localStorage.setItem('southstack_current_workspace', id);

    console.log(`📁 Created workspace: ${name}`);
    return newWorkspace;
  }, [saveWorkspaceToDB]);

  // Delete workspace
  const deleteWorkspace = useCallback((workspaceId) => {
    if (Object.keys(workspaces).length === 1) {
      console.warn('⚠️ Cannot delete the last workspace');
      return false;
    }

    if (workspaceId === 'default') {
      console.warn('⚠️ Cannot delete the default workspace');
      return false;
    }

    setWorkspaces(prev => {
      const newWorkspaces = { ...prev };
      delete newWorkspaces[workspaceId];
      return newWorkspaces;
    });

    // Delete from DB
    if (db) {
      const transaction = db.transaction(['workspaces'], 'readwrite');
      const objectStore = transaction.objectStore('workspaces');
      objectStore.delete(workspaceId);
    }

    // Switch to another workspace if current is deleted
    if (currentWorkspaceId === workspaceId) {
      const remainingWorkspaces = Object.keys(workspaces).filter(id => id !== workspaceId);
      if (remainingWorkspaces.length > 0) {
        switchWorkspace(remainingWorkspaces[0]);
      }
    }

    console.log(`🗑️ Deleted workspace: ${workspaceId}`);
    return true;
  }, [workspaces, currentWorkspaceId, db]);

  // Switch to different workspace
  const switchWorkspace = useCallback((workspaceId) => {
    setCurrentWorkspaceId(workspaceId);
    localStorage.setItem('southstack_current_workspace', workspaceId);
    if (workspaces[workspaceId]) {
      console.log(`🔄 Switched to workspace: ${workspaces[workspaceId].name}`);
    } else {
      console.log(`🔄 Switched to workspace: ${workspaceId}`);
    }
    return true;
  }, [workspaces]);

  // Rename workspace
  const renameWorkspace = useCallback((workspaceId, newName) => {
    if (!workspaces[workspaceId]) {
      console.warn(`⚠️ Workspace "${workspaceId}" not found`);
      return false;
    }

    const updatedWorkspace = {
      ...workspaces[workspaceId],
      name: newName,
      updatedAt: Date.now(),
    };

    setWorkspaces(prev => ({
      ...prev,
      [workspaceId]: updatedWorkspace,
    }));

    saveWorkspaceToDB(updatedWorkspace);
    console.log(`✏️ Renamed workspace to: ${newName}`);
    return true;
  }, [workspaces, saveWorkspaceToDB]);

  // Update workspace (for file operations)
  const updateWorkspace = useCallback((workspaceId, updates) => {
    if (!workspaces[workspaceId]) {
      return;
    }

    const updatedWorkspace = {
      ...workspaces[workspaceId],
      ...updates,
      updatedAt: Date.now(),
    };

    setWorkspaces(prev => ({
      ...prev,
      [workspaceId]: updatedWorkspace,
    }));

    saveWorkspaceToDB(updatedWorkspace);
  }, [workspaces, saveWorkspaceToDB]);

  // Get current workspace
  const getCurrentWorkspace = useCallback(() => {
    return workspaces[currentWorkspaceId] || null;
  }, [workspaces, currentWorkspaceId]);

  // Get all workspace names
  const getWorkspaceList = useCallback(() => {
    return Object.values(workspaces).map(ws => ({
      id: ws.id,
      name: ws.name,
      fileCount: Object.keys(ws.files).length,
      updatedAt: ws.updatedAt,
    }));
  }, [workspaces]);

  return {
    workspaces,
    currentWorkspaceId,
    getCurrentWorkspace,
    getWorkspaceList,
    createWorkspace,
    deleteWorkspace,
    switchWorkspace,
    renameWorkspace,
    updateWorkspace,
  };
}
