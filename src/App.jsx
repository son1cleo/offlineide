// useRef imported for managing persistent process reference
import { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import AIChat from './components/AIChat';
import { useWebContainer } from './hooks/useWebContainer';
import { useFileSystem } from './hooks/useFileSystem';
import { useAI } from './hooks/useAI';
import { getLanguageFromExtension, isExecutableLanguage } from './utils/languages';
import { executeCode } from './utils/runtime';
import './App.css';

/**
 * Main App Component
 * Root component for SouthStack IDE
 */
function App() {
  // File system management
  const {
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
  } = useFileSystem();

  const currentFileData = getCurrentFile();

  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const processRef = useRef(null);
  const writeInputRef = useRef(null);
  const killProcessRef = useRef(null);

  const {
    isLoading: containerLoading,
    isBooted,
    error: containerError,
    retryBoot,
    writeFile,
    runCommand,
  } = useWebContainer();

  const {
    isLoading: aiLoading,
    isReady: aiReady,
    loadingProgress: aiProgress,
    loadingStatus: aiStatus,
    initializeAI,
    chat: aiChat,
    generateCompletion,
  } = useAI();

  const [rememberAI, setRememberAI] = useState(() => {
    return localStorage.getItem('southstack_ai_autoload') === 'true';
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [useFileContext, setUseFileContext] = useState(true);

  useEffect(() => {
    if (rememberAI && !aiReady && !aiLoading) {
      initializeAI();
    }
  }, [rememberAI, aiReady, aiLoading, initializeAI]);

  const handleCodeChange = (newCode) => {
    updateFile(currentFile, newCode);
  };

  const handleFileSelect = (fileName) => {
    setCurrentFile(fileName);
    setTerminalOutput([]);
  };

  const handleFileCreate = (fileName) => {
    const finalFileName = fileName.includes('.') ? fileName : `${fileName}.js`;

    if (files[finalFileName]) {
      alert(`File "${finalFileName}" already exists!`);
      return;
    }

    createFile(finalFileName);
  };

  const extractFirstCodeBlock = (text) => {
    if (!text) {
      return '';
    }
    const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : '';
  };

  const handleInsertCode = (content) => {
    const codeBlock = extractFirstCodeBlock(content);
    if (!codeBlock) {
      return;
    }
    const current = currentFileData?.content || '';
    const next = current.trim() ? `${current}\n\n${codeBlock}` : codeBlock;
    updateFile(currentFile, next);
  };

  const handleAISend = async (message) => {
    const newMessages = [
      ...chatMessages,
      { role: 'user', content: message },
    ];
    setChatMessages(newMessages);
    setIsAIProcessing(true);

    try {
      const contextBlock = useFileContext
        ? `The user is working on a file called "${currentFile}" with this code:\n\`\`\`javascript\n${currentFileData?.content || ''}\n\`\`\`\n\n`
        : '';

      const systemMessage = {
        role: 'system',
        content: `You are a helpful coding assistant. ${contextBlock}Provide helpful, concise answers and return code in fenced blocks when appropriate.`,
      };

      const messagesForAI = [systemMessage, ...newMessages];
      let assistantResponse = '';

      await aiChat(messagesForAI, (chunk) => {
        assistantResponse += chunk;
        setChatMessages([
          ...newMessages,
          { role: 'assistant', content: assistantResponse },
        ]);
      });
    } catch (error) {
      console.error('AI chat error:', error);
      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAICompletion = async (codeContext, prompt) => {
    if (!aiReady) {
      return '';
    }
    return generateCompletion(codeContext, prompt);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const saveStatus = isSaving
    ? 'Saving...'
    : lastSavedAt
      ? `Saved ${formatTime(lastSavedAt)}`
      : 'Not saved';

  const handleRememberAIChange = (value) => {
    setRememberAI(value);
    localStorage.setItem('southstack_ai_autoload', value ? 'true' : 'false');
  };

  const handleRunCode = async () => {
    if (!isBooted) {
      setTerminalOutput([
        { type: 'error', text: 'WebContainer is not ready yet. Please wait...' },
      ]);
      return;
    }

    const currentFileData = getCurrentFile();
    const language = getLanguageFromExtension(currentFile).id;

    // Check if language is executable
    if (!isExecutableLanguage(language)) {
      setTerminalOutput([
        { type: 'error', text: `❌ Language "${language}" is not executable in this environment.` },
      ]);
      return;
    }

    setIsRunning(true);
    setWaitingForInput(false);
    setTerminalOutput([
      { type: 'info', text: `⚡ Executing ${currentFile} (${language})...` },
    ]);

    try {
      const result = await executeCode(
        language,
        currentFile,
        currentFileData.content,
        { writeFile, runCommand },
        // onOutput callback
        (text) => {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'success', text },
          ]);
          // Heuristic: Some output patterns suggest waiting for input
          if (text.includes('?') || text.includes(':') || text.toLowerCase().includes('enter')) {
            setWaitingForInput(true);
          }
        },
        // onError callback
        (error) => {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'error', text: error },
          ]);
        },
        // onProgress callback
        (message) => {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'info', text: message },
          ]);
        }
      );

      // Store process references for interactive communication
      processRef.current = result.process;
      writeInputRef.current = result.writeInput;
      killProcessRef.current = result.kill;

      // Wait for process to complete
      const exitCode = await result.exitPromise;

      if (exitCode === 0) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'success', text: '✅ Code executed successfully' },
        ]);
      } else {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `❌ Process exited with code ${exitCode}` },
        ]);
      }
    } catch (error) {
      console.error('Execution error:', error);
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'error', text: `❌ Error: ${error.message}` },
      ]);
    } finally {
      setIsRunning(false);
      setWaitingForInput(false);
      processRef.current = null;
      writeInputRef.current = null;
      killProcessRef.current = null;
    }
  };

  const handleStopCode = () => {
    if (killProcessRef.current) {
      try {
        killProcessRef.current();
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: '⛔ Process stopped by user' },
        ]);
      } catch (err) {
        console.error('Failed to kill process:', err);
      }
      setIsRunning(false);
      setWaitingForInput(false);
      processRef.current = null;
      writeInputRef.current = null;
      killProcessRef.current = null;
    }
  };

  const handleTerminalInput = async (input) => {
    if (writeInputRef.current) {
      // Echo the input to terminal
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'input', text: `› ${input}` },
      ]);
      
      // Send to process stdin
      await writeInputRef.current(input);
      
      // Reset waiting state after input
      setWaitingForInput(false);
    }
  };

  return (
    <Layout
      fileName={currentFile}
      fileNames={getFileNames()}
      onFileSelect={handleFileSelect}
      onFileCreate={handleFileCreate}
      onFileDelete={deleteFile}
      onFileRename={renameFile}
      onRunCode={handleRunCode}
      onStopCode={handleStopCode}
      isRunning={isRunning}
      containerError={containerError}
      onRetryWebContainer={retryBoot}
      saveStatus={saveStatus}
      containerStatus={
        containerLoading
          ? 'loading'
          : containerError
            ? 'error'
            : isBooted
              ? 'ready'
              : 'initializing'
      }
    >
      <div className="workspace">
        <div className="editor-section">
          <div className="editor-panel">
            <Editor
              code={currentFileData?.content || ''}
              onChange={handleCodeChange}
              language={currentFileData?.language || 'javascript'}
              onRequestCompletion={handleAICompletion}
              aiReady={aiReady}
              aiLoading={aiLoading}
            />
          </div>
          <div className="terminal-panel">
            <Terminal 
              output={terminalOutput} 
              isRunning={isRunning}
              onInput={handleTerminalInput}
              waitingForInput={waitingForInput}
            />
          </div>
        </div>
        <div className="ai-panel">
          <AIChat
            messages={chatMessages}
            onSendMessage={handleAISend}
            onInsertCode={handleInsertCode}
            isProcessing={isAIProcessing}
            isReady={aiReady}
            isLoading={aiLoading}
            loadingProgress={aiProgress}
            loadingStatus={aiStatus}
            onInitialize={initializeAI}
            rememberChoice={rememberAI}
            onToggleRemember={handleRememberAIChange}
            useFileContext={useFileContext}
            onToggleContext={setUseFileContext}
          />
        </div>
      </div>
    </Layout>
  );
}

export default App;
