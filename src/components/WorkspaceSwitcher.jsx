import { useState } from 'react';
import './WorkspaceSwitcher.css';

/**
 * WorkspaceSwitcher Component
 * Allows users to create, switch between, and manage workspaces
 * @param {Object} props - Component props
 * @param {Array} props.workspaces - List of available workspaces
 * @param {string} props.currentWorkspaceId - ID of currently active workspace
 * @param {Function} props.onSwitchWorkspace - Callback when workspace is switched
 * @param {Function} props.onCreateWorkspace - Callback to create new workspace
 * @param {Function} props.onDeleteWorkspace - Callback to delete workspace
 * @param {Function} props.onRenameWorkspace - Callback to rename workspace
 */
function WorkspaceSwitcher({
  workspaces = [],
  currentWorkspaceId,
  onSwitchWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onRenameWorkspace,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const currentWorkspace = workspaces.find(ws => ws.id === currentWorkspaceId);

  const handleCreate = () => {
    if (newWorkspaceName.trim()) {
      onCreateWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setIsCreating(false);
    }
  };

  const handleRename = (workspaceId) => {
    if (renameValue.trim()) {
      onRenameWorkspace(workspaceId, renameValue.trim());
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const handleDelete = (workspaceId) => {
    if (confirm('Are you sure you want to delete this workspace? All files will be lost.')) {
      onDeleteWorkspace(workspaceId);
    }
  };

  return (
    <div className="workspace-switcher">
      <button
        className="workspace-current"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch workspace"
      >
        <span className="workspace-icon">📁</span>
        <span className="workspace-name">{currentWorkspace?.name || 'Select Workspace'}</span>
        <span className="workspace-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="workspace-dropdown">
          <div className="workspace-list">
            {workspaces.map(workspace => (
              <div
                key={workspace.id}
                className={`workspace-item ${workspace.id === currentWorkspaceId ? 'active' : ''}`}
              >
                {renamingId === workspace.id ? (
                  <div className="workspace-rename">
                    <input
                      type="text"
                      className="workspace-rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(workspace.id);
                        if (e.key === 'Escape') {
                          setRenamingId(null);
                          setRenameValue('');
                        }
                      }}
                      autoFocus
                      placeholder="Workspace name"
                    />
                    <button
                      className="workspace-btn workspace-btn-save"
                      onClick={() => handleRename(workspace.id)}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      className="workspace-btn workspace-btn-cancel"
                      onClick={() => {
                        setRenamingId(null);
                        setRenameValue('');
                      }}
                      title="Cancel"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="workspace-item-main"
                      onClick={() => {
                        onSwitchWorkspace(workspace.id);
                        setIsOpen(false);
                      }}
                    >
                      <span className="workspace-item-icon">
                        {workspace.id === currentWorkspaceId ? '✓' : '📁'}
                      </span>
                      <div className="workspace-item-info">
                        <div className="workspace-item-name">{workspace.name}</div>
                        <div className="workspace-item-meta">
                          {workspace.fileCount} {workspace.fileCount === 1 ? 'file' : 'files'}
                        </div>
                      </div>
                    </button>
                    <div className="workspace-item-actions">
                      <button
                        className="workspace-btn workspace-btn-rename"
                        onClick={() => {
                          setRenamingId(workspace.id);
                          setRenameValue(workspace.name);
                        }}
                        title="Rename workspace"
                      >
                        ✏️
                      </button>
                      {workspace.id !== 'default' && (
                        <button
                          className="workspace-btn workspace-btn-delete"
                          onClick={() => handleDelete(workspace.id)}
                          title="Delete workspace"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="workspace-create">
            {isCreating ? (
              <div className="workspace-create-form">
                <input
                  type="text"
                  className="workspace-create-input"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewWorkspaceName('');
                    }
                  }}
                  placeholder="New workspace name"
                  autoFocus
                />
                <button
                  className="workspace-btn workspace-btn-save"
                  onClick={handleCreate}
                  title="Create"
                >
                  ✓
                </button>
                <button
                  className="workspace-btn workspace-btn-cancel"
                  onClick={() => {
                    setIsCreating(false);
                    setNewWorkspaceName('');
                  }}
                  title="Cancel"
                >
                  ✗
                </button>
              </div>
            ) : (
              <button
                className="workspace-create-btn"
                onClick={() => setIsCreating(true)}
              >
                <span className="workspace-create-icon">➕</span>
                New Workspace
              </button>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="workspace-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default WorkspaceSwitcher;
