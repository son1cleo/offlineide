import { useRef, useEffect } from 'react';
import './Terminal.css';

/**
 * Terminal Component
 * Displays command output and execution logs
 * @param {Object} props - Component props
 * @param {Array} props.output - Array of output lines
 * @param {boolean} props.isRunning - Whether code is currently executing
 */
function Terminal({ output = [], isRunning = false }) {
  const terminalRef = useRef(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-tabs">
          <div className="terminal-tab active">
            <span className="terminal-icon">⚡</span>
            Output
          </div>
        </div>
        <div className="terminal-actions">
          {isRunning && (
            <span className="terminal-status">
              <span className="status-spinner"></span>
              Running...
            </span>
          )}
        </div>
      </div>
      
      <div className="terminal-content" ref={terminalRef}>
        {output.length === 0 ? (
          <div className="terminal-empty">
            <p>💡 Click "Run Code" to execute your JavaScript</p>
            <p className="terminal-hint">WebContainer is ready • Node.js runtime active</p>
          </div>
        ) : (
          <div className="terminal-output">
            {output.map((line, index) => (
              <div
                key={index}
                className={`terminal-line ${line.type || ''}`}
              >
                {line.type === 'error' && <span className="line-icon">❌</span>}
                {line.type === 'success' && <span className="line-icon">✅</span>}
                {line.type === 'info' && <span className="line-icon">ℹ️</span>}
                <span className="line-text">{line.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Terminal;
