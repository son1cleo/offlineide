import { useMemo, useCallback } from 'react';
import { useWorkspace } from './useWorkspace';

/**
 * Adapter hook that provides file system interface while using workspace backend
 * This maintains backward compatibility with existing code that expects file-based operations
 * @returns {Object} File system interface backed by workspaces
 */
export function useFileSystemWithWorkspace() {
  const {
    workspaces,
    currentWorkspaceId,
    getCurrentWorkspace,
    getWorkspaceList,
    createWorkspace,
    deleteWorkspace,
    switchWorkspace,
    renameWorkspace,
    updateWorkspace,
  } = useWorkspace();

  const currentWorkspace = getCurrentWorkspace();

  // File operations (delegated to current workspace)
  const files = useMemo(() => {
    return currentWorkspace?.files || {};
  }, [currentWorkspace]);

  const currentFile = useMemo(() => {
    return currentWorkspace?.currentFile || Object.keys(files)[0] || 'main.js';
  }, [currentWorkspace, files]);

  const setCurrentFile = useCallback((fileName) => {
    if (currentWorkspace && files[fileName]) {
      updateWorkspace(currentWorkspaceId, {
        ...currentWorkspace,
        currentFile: fileName,
      });
    }
  }, [currentWorkspace, currentWorkspaceId, files, updateWorkspace]);

  const createFile = useCallback((fileName, content = '') => {
    if (!currentWorkspace) return null;

    const newFile = {
      name: fileName,
      content,
      language: getLanguageFromFileExtension(fileName),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedFiles = {
      ...currentWorkspace.files,
      [fileName]: newFile,
    };

    updateWorkspace(currentWorkspaceId, {
      ...currentWorkspace,
      files: updatedFiles,
      currentFile: fileName,
    });

    console.log(`📄 Created file: ${fileName} in workspace "${currentWorkspace.name}"`);
    return newFile;
  }, [currentWorkspace, currentWorkspaceId, updateWorkspace]);

  const updateFile = useCallback((fileName, content) => {
    if (!currentWorkspace || !files[fileName]) return;

    const updatedFile = {
      ...files[fileName],
      content,
      updatedAt: Date.now(),
    };

    const updatedFiles = {
      ...currentWorkspace.files,
      [fileName]: updatedFile,
    };

    updateWorkspace(currentWorkspaceId, {
      ...currentWorkspace,
      files: updatedFiles,
    });
  }, [currentWorkspace, currentWorkspaceId, files, updateWorkspace]);

  const deleteFile = useCallback((fileName) => {
    if (!currentWorkspace) return false;

    const fileCount = Object.keys(files).length;
    if (fileCount === 1) {
      console.warn('⚠️ Cannot delete the last file');
      return false;
    }

    const updatedFiles = { ...files };
    delete updatedFiles[fileName];

    let newCurrentFile = currentFile;
    if (currentFile === fileName) {
      const remainingFiles = Object.keys(updatedFiles);
      newCurrentFile = remainingFiles[0] || 'main.js';
    }

    updateWorkspace(currentWorkspaceId, {
      ...currentWorkspace,
      files: updatedFiles,
      currentFile: newCurrentFile,
    });

    console.log(`🗑️ Deleted file: ${fileName}`);
    return true;
  }, [currentWorkspace, currentWorkspaceId, files, currentFile, updateWorkspace]);

  const renameFile = useCallback((oldName, newName) => {
    if (!currentWorkspace) return false;

    if (files[newName]) {
      console.warn('⚠️ File already exists');
      return false;
    }

    const file = files[oldName];
    const renamedFile = {
      ...file,
      name: newName,
      language: getLanguageFromFileExtension(newName),
      updatedAt: Date.now(),
    };

    const updatedFiles = { ...files };
    delete updatedFiles[oldName];
    updatedFiles[newName] = renamedFile;

    const newCurrentFile = currentFile === oldName ? newName : currentFile;

    updateWorkspace(currentWorkspaceId, {
      ...currentWorkspace,
      files: updatedFiles,
      currentFile: newCurrentFile,
    });

    console.log(`✏️ Renamed ${oldName} to ${newName}`);
    return true;
  }, [currentWorkspace, currentWorkspaceId, files, currentFile, updateWorkspace]);

  const changeFileLanguage = useCallback((fileName, languageId) => {
    if (!currentWorkspace || !files[fileName]) return;

    const normalizedLanguageId = typeof languageId === 'string'
      ? languageId
      : getLanguageFromFileExtension(fileName);

    const updatedFile = {
      ...files[fileName],
      language: normalizedLanguageId,
      updatedAt: Date.now(),
    };

    const updatedFiles = {
      ...currentWorkspace.files,
      [fileName]: updatedFile,
    };

    updateWorkspace(currentWorkspaceId, {
      ...currentWorkspace,
      files: updatedFiles,
    });
  }, [currentWorkspace, currentWorkspaceId, files, updateWorkspace]);

  const getCurrentFile = useCallback(() => {
    if (!files[currentFile]) return null;
    
    const file = files[currentFile];
    const normalizedLanguage = getLanguageFromFileExtension(file.name);
    
    if (file.language === normalizedLanguage) {
      return file;
    }

    return {
      ...file,
      language: normalizedLanguage,
    };
  }, [files, currentFile]);

  const getFileNames = useCallback(() => {
    return Object.keys(files).sort();
  }, [files]);

  // Helper function
  const getLanguageFromFileExtension = (fileName) => {
    if (!fileName) return 'javascript';
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.sh': 'bash',
      '.bash': 'bash',
      '.json': 'json',
      '.html': 'html',
      '.htm': 'html',
    };

    return languageMap[ext] || 'javascript';
  };

  // Workspace-specific operations (exposed for UI)
  const workspaceOperations = {
    getCurrentWorkspace,
    getWorkspaceList,
    createWorkspace,
    deleteWorkspace,
    switchWorkspace,
    renameWorkspace,
    currentWorkspaceId,
  };

  return {
    // File system interface (backward compatible)
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
    lastSavedAt: currentWorkspace?.updatedAt || null,
    isSaving: false, // Workspace saves are synchronous
    
    // Workspace operations (new)
    workspace: workspaceOperations,
  };
}
