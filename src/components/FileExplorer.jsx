import { useState } from 'react';
import './FileExplorer.css';

/**
 * FileExplorer Component
 * Displays file tree with create, delete, and rename operations
 * @param {Object} props - Component props
 * @param {Array} props.fileNames - List of file names
 * @param {string} props.currentFile - Currently active file
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {Function} props.onFileCreate - Callback to create new file
 * @param {Function} props.onFileDelete - Callback to delete file
 * @param {Function} props.onFileRename - Callback to rename file
 */
function FileExplorer({ 
  fileNames = [], 
  currentFile, 
  onFileSelect, 
  onFileCreate,
  onFileDelete,
  onFileRename,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Get icon based on file extension
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'js': '📜',
      'jsx': '⚛️',
      'ts': '📘',
      'tsx': '⚛️',
      'py': '🐍',
      'json': '📋',
      'html': '🌐',
      'css': '🎨',
      'md': '📝',
      'txt': '📄',
    };
    return iconMap[ext] || '📄';
  };

  // Handle new file creation
  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  // Handle file rename
  const handleRenameFile = (oldName) => {
    if (renameValue.trim() && renameValue !== oldName) {
      onFileRename(oldName, renameValue.trim());
    }
    setRenamingFile(null);
    setRenameValue('');
  };

  // Start renaming
  const startRename = (fileName) => {
    setRenamingFile(fileName);
    setRenameValue(fileName);
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <h3 className="explorer-title">📁 FILES</h3>
        <button 
          className="explorer-action-btn"
          onClick={() => setIsCreating(true)}
          title="New File"
          aria-label="Create new file"
        >
          ➕
        </button>
      </div>

      <div className="file-list">
        {/* New file input */}
        {isCreating && (
          <div className="file-item new-file">
            <span className="file-icon">📄</span>
            <input
              type="text"
              className="file-input"
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              onBlur={() => {
                if (!newFileName.trim()) setIsCreating(false);
              }}
              autoFocus
            />
          </div>
        )}

        {/* File list */}
        {fileNames.map((fileName) => (
          <div key={fileName}>
            {renamingFile === fileName ? (
              <div className="file-item renaming">
                <span className="file-icon">{getFileIcon(fileName)}</span>
                <input
                  type="text"
                  className="file-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameFile(fileName);
                    if (e.key === 'Escape') setRenamingFile(null);
                  }}
                  onBlur={() => handleRenameFile(fileName)}
                  autoFocus
                />
              </div>
            ) : (
              <div
                className={`file-item ${currentFile === fileName ? 'active' : ''}`}
                onClick={() => onFileSelect(fileName)}
              >
                <span className="file-icon">{getFileIcon(fileName)}</span>
                <span className="file-name">{fileName}</span>
                <div className="file-actions">
                  <button
                    className="file-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(fileName);
                    }}
                    title="Rename"
                  >
                    ✏️
                  </button>
                  <button
                    className="file-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete ${fileName}?`)) {
                        onFileDelete(fileName);
                      }
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {fileNames.length === 0 && !isCreating && (
          <div className="explorer-empty">
            <p>No files yet</p>
            <button onClick={() => setIsCreating(true)}>Create one</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileExplorer;
