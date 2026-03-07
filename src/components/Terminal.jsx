import { useRef, useEffect, useState } from 'react';
import './Terminal.css';

/**
 * Terminal Component
 * Interactive terminal with stdin support for real-time user input
 * @param {Object} props - Component props
 * @param {Array} props.output - Array of output lines
 * @param {boolean} props.isRunning - Whether code is currently executing
 * @param {Function} props.onInput - Callback when user submits input
 * @param {boolean} props.waitingForInput - Whether process is waiting for input
 * @param {boolean} props.shellEnabled - Whether shell command input is enabled
 * @param {boolean} props.shellBusy - Whether shell command is currently running
 * @param {boolean} props.shellReady - Whether shell backend is ready
 */
function Terminal({
  output = [],
  isRunning = false,
  onInput,
  waitingForInput = false,
  shellEnabled = false,
  shellBusy = false,
  shellReady = false,
}) {
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  const inputEnabled = isRunning || shellEnabled;

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Auto-focus input when running / waiting for input
  useEffect(() => {
    if ((isRunning || waitingForInput || shellEnabled) && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isRunning, waitingForInput, shellEnabled]);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (onInput && inputEnabled) {
      onInput(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    // Handle Enter key separately to ensure it always submits
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onInput && inputEnabled) {
        onInput(inputValue);
        setInputValue('');
      }
      return;
    }
    
    // Prevent default behavior for Ctrl+C to send interrupt signal
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (onInput && isRunning) {
        onInput('\x03'); // Send ETX (End of Text) signal
      }
    }
  };

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
          {!isRunning && shellEnabled && (
            <span className="terminal-status">
              {shellBusy ? 'Running command...' : (shellReady ? 'Shell ready' : 'Shell not ready')}
            </span>
          )}
          {waitingForInput && (
            <span className="terminal-status waiting">
              <span className="status-blink">▊</span>
              Waiting for input...
            </span>
          )}
        </div>
      </div>
      
      <div className="terminal-content" ref={terminalRef}>
        {output.length === 0 ? (
          <div className="terminal-empty">
            <p>💡 Click "Run Code" to execute your code</p>
            <p className="terminal-hint">WebContainer is ready • Multi-language support active</p>
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
                {line.type === 'input' && <span className="line-icon">›</span>}
                <span className="line-text">{line.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Interactive input prompt */}
        {inputEnabled && (
          <form className="terminal-input-form" onSubmit={handleInputSubmit}>
            <span className="input-prompt">{isRunning ? '›' : '$'}</span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRunning
                ? (waitingForInput ? 'Type input and press Enter...' : 'Type and press Enter...')
                : 'Type a command (git status, git init, help, clear)'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              autoCapitalize="off"
              disabled={shellBusy && !isRunning}
              data-testid="terminal-input"
            />
          </form>
        )}
      </div>
    </div>
  );
}

export default Terminal;
