import { useState, useRef, useEffect } from 'react';
import './AIChat.css';

/**
 * AIChat Component
 * Chat interface for AI assistance
 * @param {Object} props - Component props
 * @param {Function} props.onSendMessage - Callback to send message
 * @param {Array} props.messages - Chat history
 * @param {boolean} props.isProcessing - Whether AI is processing
 * @param {boolean} props.isReady - Whether AI is ready
 * @param {boolean} props.isLoading - Whether AI is loading
 * @param {number} props.loadingProgress - Loading progress percentage
 * @param {string} props.loadingStatus - Loading status text
 * @param {Function} props.onInitialize - Callback to initialize AI
 * @param {boolean} props.rememberChoice - Remember auto-load preference
 * @param {Function} props.onToggleRemember - Toggle auto-load preference
 * @param {boolean} props.useFileContext - Whether to include file context
 * @param {Function} props.onToggleContext - Toggle file context
 * @param {Function} props.onInsertCode - Insert code into editor
 */
function AIChat({ 
  onSendMessage, 
  messages = [], 
  isProcessing = false,
  isReady = false,
  isLoading = false,
  loadingProgress = 0,
  loadingStatus = '',
  onInitialize,
  rememberChoice = false,
  onToggleRemember,
  useFileContext = true,
  onToggleContext,
  onInsertCode,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = () => {
    if (input.trim() && !isProcessing && isReady) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasCodeBlock = (text) => /```[\s\S]*?```/.test(text || '');

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">🤖</span>
          <span>AI Assistant</span>
        </div>
        <div className="chat-status">
          {isLoading && (
            <span className="status-badge loading">
              Loading {loadingProgress}%
            </span>
          )}
          {isReady && !isLoading && (
            <span className="status-badge ready">Ready</span>
          )}
          {!isReady && !isLoading && (
            <span className="status-badge offline">Offline</span>
          )}
        </div>
        <label className="context-toggle">
          <input
            type="checkbox"
            checked={useFileContext}
            onChange={(e) => onToggleContext?.(e.target.checked)}
          />
          <span>Use file context</span>
        </label>
      </div>

      <div className="chat-content">
        {!isReady && !isLoading && (
          <div className="chat-welcome">
            <div className="welcome-icon">🤖</div>
            <h3>Local AI Assistant</h3>
            <p>Get code help without any API keys!</p>
            <button className="init-button" onClick={onInitialize}>
              <span className="button-icon">⚡</span>
              Initialize AI Model
            </button>
            <label className="remember-toggle">
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => onToggleRemember?.(e.target.checked)}
              />
              <span>Remember my choice</span>
            </label>
            <div className="welcome-note">
              <p>📥 First load: ~900MB download</p>
              <p>⚡ Subsequent loads: Instant</p>
              <p>🔒 100% local, no data sent</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="chat-loading">
            <div className="loading-spinner-large"></div>
            <h3>Coming at ya!</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="loading-text">{loadingStatus}</p>
            <p className="loading-percentage">{loadingProgress}%</p>
          </div>
        )}

        {isReady && (
          <>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <p>💡 Ask me anything about your code!</p>
                  <div className="suggestion-chips">
                    <button 
                      className="chip"
                      onClick={() => setInput('Explain the current code')}
                    >
                      Explain code
                    </button>
                    <button 
                      className="chip"
                      onClick={() => setInput('How can I optimize this?')}
                    >
                      Optimize
                    </button>
                    <button 
                      className="chip"
                      onClick={() => setInput('Add comments to the code')}
                    >
                      Add comments
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`chat-message ${msg.role}`}
                  >
                    <div className="message-avatar">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{msg.content}</div>
                      {msg.role === 'assistant' && hasCodeBlock(msg.content) && (
                        <button
                          className="insert-button"
                          onClick={() => onInsertCode?.(msg.content)}
                          type="button"
                        >
                          Insert code
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isProcessing && (
                <div className="chat-message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

      {isReady && (
        <div className="chat-input-container">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask AI anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isProcessing}
            rows={1}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
          >
            <span className="send-icon">➤</span>
          </button>
          <div className="template-row">
            <button className="chip" onClick={() => setInput('Explain the current file')}>Explain</button>
            <button className="chip" onClick={() => setInput('Find bugs and edge cases')}>Debug</button>
            <button className="chip" onClick={() => setInput('Refactor for clarity')}>Refactor</button>
            <button className="chip" onClick={() => setInput('Add comments to the code')}>Comment</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChat;
