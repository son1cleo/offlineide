import { useState } from 'react';
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
 * @param {React.ReactNode} props.aiPanel - AI Chat panel component
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
  aiPanel,
  children 
}) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  return (
    <div className="layout">{leftPanelOpen && <div className="mobile-overlay" onClick={() => setLeftPanelOpen(false)} />}
      {rightPanelOpen && <div className="mobile-overlay" onClick={() => setRightPanelOpen(false)} />}
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
        {/* Desktop Sidebar */}
        <aside className="sidebar desktop-only">
          <FileExplorer
            fileNames={fileNames}
            currentFile={fileName}
            onFileSelect={onFileSelect}
            onFileCreate={onFileCreate}
            onFileDelete={onFileDelete}
            onFileRename={onFileRename}
          />
        </aside>

        {/* Mobile Left Panel (Files) */}
        <aside className={`mobile-panel mobile-panel-left ${leftPanelOpen ? 'open' : ''}`}>
          <div className="mobile-panel-header">
            <h3>Files</h3>
            <button className="mobile-close-btn" onClick={() => setLeftPanelOpen(false)}>×</button>
          </div>
          <FileExplorer
            fileNames={fileNames}
            currentFile={fileName}
            onFileSelect={(file) => {
              onFileSelect(file);
              setLeftPanelOpen(false);
            }}
            onFileCreate={onFileCreate}
            onFileDelete={onFileDelete}
            onFileRename={onFileRename}
          />
        </aside>

        {/* Mobile Right Panel (AI) */}
        <aside className={`mobile-panel mobile-panel-right ${rightPanelOpen ? 'open' : ''}`}>
          <div className="mobile-panel-header">
            <h3>AI Assistant</h3>
            <button className="mobile-close-btn" onClick={() => setRightPanelOpen(false)}>×</button>
          </div>
          <div className="mobile-panel-content">
            {aiPanel}
          </div>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Bottom Status Bar - Desktop */}
      <footer className="layout-footer desktop-only">
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

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-btn ${leftPanelOpen ? 'active' : ''}`}
          onClick={() => {
            setLeftPanelOpen(!leftPanelOpen);
            setRightPanelOpen(false);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          <span>Files</span>
        </button>

        <button 
          className="mobile-nav-btn mobile-nav-run"
          onClick={onRunCode}
          disabled={isRunning || containerStatus !== 'ready'}
        >
          {isRunning ? (
            <>
              <span className="button-spinner"></span>
              <span>Running</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Run</span>
            </>
          )}
        </button>

        <button 
          className="mobile-nav-btn"
          onClick={() => {
            // Toggle terminal visibility (handled by parent)
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8l4 4-4 4M12 16h6" />
          </svg>
          <span>Console</span>
        </button>

        <button 
          className={`mobile-nav-btn ${rightPanelOpen ? 'active' : ''}`}
          onClick={() => {
            setRightPanelOpen(!rightPanelOpen);
            setLeftPanelOpen(false);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>AI</span>
        </button>
      </nav>
    </div>
  );
}

export default Layout;
