import './Layout.css';
import FileExplorer from './FileExplorer';

/**
 * Layout Component
 * Main IDE layout with header and content area
 * @param {Object} props - Component props
 * @param {string} props.fileName - Current open file name
 * @param {Function} props.onRunCode - Callback to run code
 * @param {Function} props.onStopCode - Callback to stop code execution
 * @param {boolean} props.isRunning - Whether code is currently running
 * @param {string} props.containerStatus - WebContainer status
 * @param {string|null} props.containerError - WebContainer error message
 * @param {Function} props.onRetryWebContainer - Retry WebContainer boot
 * @param {Array} props.fileNames - List of file names
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {Function} props.onFileCreate - Callback to create new file
 * @param {Function} props.onFileDelete - Callback to delete file
 * @param {Function} props.onFileRename - Callback to rename file
 * @param {string} props.saveStatus - Autosave status text
 * @param {React.ReactNode} props.children - Child components (Editor, etc.)
 */
function Layout({ 
  fileName, 
  onRunCode, 
  onStopCode,
  isRunning, 
  containerStatus, 
  containerError,
  onRetryWebContainer,
  fileNames,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  saveStatus,
  children 
}) {
  return (
    <div className="layout">
      {/* Hidden SVG for gradient definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#58a6ff', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#1f6feb', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#388bfd', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Top Bar */}
      <header className="layout-header">
        <div className="header-left">
          <div className="app-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" className="logo-path"/>
              </svg>
            </div>
          </div>
          <div className="file-info">
            <span className="file-icon">📄</span>
            <span className="file-name">{fileName}</span>
          </div>
        </div>
        
        <div className="header-right">
          {isRunning ? (
            <button 
              className="stop-button"
              onClick={onStopCode}
            >
              <span className="button-icon">⏹️</span>
              Stop
            </button>
          ) : (
            <button 
              className="run-button"
              onClick={onRunCode}
              disabled={containerStatus !== 'ready'}
            >
              <span className="button-icon">▶️</span>
              Run Code
            </button>
          )}
          
          <span className={`status-indicator status-${containerStatus}`}>
            <span className="status-dot"></span>
            {containerStatus === 'loading' && 'Loading...'}
            {containerStatus === 'ready' && 'Ready'}
            {containerStatus === 'error' && 'Error'}
            {containerStatus === 'initializing' && 'Starting...'}
          </span>

          {containerStatus === 'error' && (
            <div className="status-error-box" role="status">
              <span className="status-error-text">
                {containerError || 'WebContainer failed to start.'}
              </span>
              <button
                className="retry-button"
                onClick={onRetryWebContainer}
                type="button"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="layout-content">
        <aside className="sidebar">
          <FileExplorer
            fileNames={fileNames}
            currentFile={fileName}
            onFileSelect={onFileSelect}
            onFileCreate={onFileCreate}
            onFileDelete={onFileDelete}
            onFileRename={onFileRename}
          />
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="layout-footer">
        <div className="footer-left">
          <span className="footer-item">JavaScript</span>
          <span className="footer-item">UTF-8</span>
          <span className="footer-item">LF</span>
        </div>
        <div className="footer-right">
          {saveStatus && <span className="footer-item">{saveStatus}</span>}
          <span className="footer-item">Ln 1, Col 1</span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
