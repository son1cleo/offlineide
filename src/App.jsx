// useRef imported for managing persistent process reference
import { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import AIChat from './components/AIChat';
import FileExplorer from './components/FileExplorer';
import LandingPage from './components/LandingPage';
import { useWebContainer } from './hooks/useWebContainer';
import { useFileSystemWithWorkspace } from './hooks/useFileSystemWithWorkspace';
import { useAI } from './hooks/useAI';
import { getLanguageFromExtension, isExecutableLanguage } from './utils/languages';
import { executeCode } from './utils/runtime';
import './App.css';

/**
 * Main App Component
 * Root component for SouthStack IDE
 */
function App() {
  // Version marker for cache troubleshooting
  useEffect(() => {
    console.log('🚀 SouthStack App v3.4 - 2026-03-08 19:00 - Branch support added');
  }, []);

  // File system management with workspace support
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
    workspace,
  } = useFileSystemWithWorkspace();

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
    createDirectory,
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
  const [isShellBusy, setIsShellBusy] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    if (rememberAI && !aiReady && !aiLoading) {
      initializeAI();
    }
  }, [rememberAI, aiReady, aiLoading, initializeAI]);

  useEffect(() => {
    if (!showLanding) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowLanding(false);
    }, 2400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showLanding]);

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
          console.log('[App] onOutput received:', { text, length: text.length });
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'success', text },
          ]);
          // If we have stdin available AND output is detected, likely waiting for input
          // Note: Some prompts may not be visible if they go directly to terminal TTY
          if (text.includes('?') || text.includes(':') || text.toLowerCase().includes('enter')) {
            console.log('[App] Input prompt pattern detected in output');
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

      // Signal that input is waiting (most interactive programs will need it)
      if (result.hasStdin) {
        console.log('[App] stdin available - marking as waiting for input');
        setWaitingForInput(true);
      }

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
    if (isRunning && writeInputRef.current) {
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'input', text: `› ${input}` },
      ]);

      await writeInputRef.current(input);
      setWaitingForInput(false);
      return;
    }

    await runShellCommand(input);
  };

  const readProcessOutput = async (process) => {
    if (!process?.output) {
      return '';
    }

    const reader = process.output.getReader();
    const decoder = new TextDecoder();
    let output = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          output += typeof value === 'string'
            ? value
            : decoder.decode(value, { stream: true });
        }
      }
      output += decoder.decode(new Uint8Array(), { stream: false });
    } catch (error) {
      console.warn('Failed reading process output:', error);
    }

    return output;
  };

  const getActiveWorkspaceId = () => workspace?.currentWorkspaceId || 'default';

  const getVirtualGitStateKey = () => `southstack_virtual_git_${getActiveWorkspaceId()}`;

  const getWorkingSnapshot = () => {
    const snapshot = {};
    getFileNames().forEach((name) => {
      snapshot[name] = files[name]?.content || '';
    });
    return snapshot;
  };

  const loadVirtualGitState = () => {
    try {
      const raw = localStorage.getItem(getVirtualGitStateKey());
      if (!raw) {
        return {
          initialized: false,
          headSnapshot: {},
          staged: [],
          commits: [],
          remotes: {},
          github: {
            token: '',
            branch: 'main',
          },
        };
      }
      const parsed = JSON.parse(raw);
      return {
        initialized: !!parsed.initialized,
        headSnapshot: parsed.headSnapshot || {},
        staged: Array.isArray(parsed.staged) ? parsed.staged : [],
        commits: Array.isArray(parsed.commits) ? parsed.commits : [],
        remotes: parsed.remotes && typeof parsed.remotes === 'object' ? parsed.remotes : {},
        github: {
          token: parsed.github?.token || '',
          branch: parsed.github?.branch || 'main',
        },
        currentBranch: parsed.currentBranch || 'main',
        branches: Array.isArray(parsed.branches) ? parsed.branches : ['main'],
      };
    } catch {
      return {
        initialized: false,
        headSnapshot: {},
        staged: [],
        commits: [],
        remotes: {},
        github: {
          token: '',
          branch: 'main',
        },
        currentBranch: 'main',
        branches: ['main'],
      };
    }
  };

  const saveVirtualGitState = (state) => {
    localStorage.setItem(getVirtualGitStateKey(), JSON.stringify(state));
  };

  const getChangedFilesAgainstHead = (headSnapshot, workingSnapshot) => {
    const names = new Set([
      ...Object.keys(headSnapshot || {}),
      ...Object.keys(workingSnapshot || {}),
    ]);

    const changed = [];
    names.forEach((name) => {
      const headContent = headSnapshot?.[name];
      const workContent = workingSnapshot?.[name];
      if (headContent !== workContent) {
        changed.push(name);
      }
    });
    return changed.sort();
  };

  const renderVirtualGitStatus = (state) => {
    const workingSnapshot = getWorkingSnapshot();
    const headSnapshot = state.headSnapshot || {};
    const stagedSet = new Set(state.staged || []);
    const allNames = new Set([
      ...Object.keys(headSnapshot),
      ...Object.keys(workingSnapshot),
    ]);

    const stagedLines = [];
    const unstagedLines = [];
    const untrackedLines = [];

    allNames.forEach((name) => {
      const headContent = headSnapshot[name];
      const workContent = workingSnapshot[name];
      const existsInHead = headContent !== undefined;
      const existsInWork = workContent !== undefined;
      const changed = headContent !== workContent;

      if (!changed) {
        return;
      }

      if (!existsInHead && existsInWork) {
        if (stagedSet.has(name)) {
          stagedLines.push(`new file: ${name}`);
        } else {
          untrackedLines.push(name);
        }
        return;
      }

      if (existsInHead && !existsInWork) {
        if (stagedSet.has(name)) {
          stagedLines.push(`deleted: ${name}`);
        } else {
          unstagedLines.push(`deleted: ${name}`);
        }
        return;
      }

      if (stagedSet.has(name)) {
        stagedLines.push(`modified: ${name}`);
      } else {
        unstagedLines.push(`modified: ${name}`);
      }
    });

    const lines = [];
    lines.push(`On branch ${state.currentBranch || 'main'}`);

    if (stagedLines.length === 0 && unstagedLines.length === 0 && untrackedLines.length === 0) {
      lines.push('nothing to commit, working tree clean');
      return lines.join('\n');
    }

    if (stagedLines.length > 0) {
      lines.push('Changes to be committed:');
      stagedLines.forEach((line) => lines.push(`  ${line}`));
    }

    if (unstagedLines.length > 0) {
      lines.push('Changes not staged for commit:');
      unstagedLines.forEach((line) => lines.push(`  ${line}`));
    }

    if (untrackedLines.length > 0) {
      lines.push('Untracked files:');
      untrackedLines.forEach((line) => lines.push(`  ${line}`));
    }

    return lines.join('\n');
  };

  const parseGithubRemote = (remoteUrl) => {
    if (!remoteUrl) {
      return null;
    }

    const httpsMatch = remoteUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }

    const sshMatch = remoteUrl.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }

    return null;
  };

  const githubRequest = async ({ owner, repo, token, method = 'GET', endpoint, body, timeoutMs = 15000 }) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.message || `GitHub API error (${response.status})`;
        throw new Error(message);
      }

      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('GitHub API request timed out. Check network and try again.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const pushToGithubApi = async ({ remoteUrl, token, branch, commitMessage }) => {
    const remote = parseGithubRemote(remoteUrl);
    if (!remote) {
      throw new Error('origin remote must be a GitHub URL (https or git@github.com)');
    }

    const { owner, repo } = remote;
    const workingSnapshot = getWorkingSnapshot();
    const treeEntries = Object.keys(workingSnapshot).map((path) => ({
      path,
      mode: '100644',
      type: 'blob',
      content: workingSnapshot[path],
    }));

    let headSha = null;
    let baseTreeSha = null;

    try {
      const headRef = await githubRequest({
        owner,
        repo,
        token,
        endpoint: `/git/ref/heads/${branch}`,
      });
      headSha = headRef?.object?.sha || null;

      if (headSha) {
        const headCommit = await githubRequest({
          owner,
          repo,
          token,
          endpoint: `/git/commits/${headSha}`,
        });
        baseTreeSha = headCommit?.tree?.sha || null;
      }
    } catch (error) {
      const errorMsg = String(error.message || '').toLowerCase();
      if (!errorMsg.includes('not found') && 
          !errorMsg.includes('409') && 
          !errorMsg.includes('empty')) {
        throw error;
      }
      // Branch doesn't exist or repo is empty - we'll create it fresh
    }

    const createdTree = await githubRequest({
      owner,
      repo,
      token,
      method: 'POST',
      endpoint: '/git/trees',
      body: baseTreeSha ? {
        tree: treeEntries,
        base_tree: baseTreeSha,
      } : {
        tree: treeEntries,
      },
    });

    const createdCommit = await githubRequest({
      owner,
      repo,
      token,
      method: 'POST',
      endpoint: '/git/commits',
      body: {
        message: commitMessage,
        tree: createdTree.sha,
        ...(headSha ? { parents: [headSha] } : {}),
      },
    });

    if (headSha) {
      await githubRequest({
        owner,
        repo,
        token,
        method: 'PATCH',
        endpoint: `/git/refs/heads/${branch}`,
        body: {
          sha: createdCommit.sha,
          force: false,
        },
      });
    } else {
      try {
        await githubRequest({
          owner,
          repo,
          token,
          method: 'POST',
          endpoint: '/git/refs',
          body: {
            ref: `refs/heads/${branch}`,
            sha: createdCommit.sha,
          },
        });
      } catch (createRefError) {
        if (String(createRefError.message || '').includes('409') || 
            String(createRefError.message || '').toLowerCase().includes('already exists') ||
            String(createRefError.message || '').toLowerCase().includes('empty')) {
          await githubRequest({
            owner,
            repo,
            token,
            method: 'PATCH',
            endpoint: `/git/refs/heads/${branch}`,
            body: {
              sha: createdCommit.sha,
              force: true,
            },
          });
        } else {
          throw createRefError;
        }
      }
    }

    return { owner, repo, branch, commitSha: createdCommit.sha };
  };

  const runVirtualGitCommand = async (args) => {
    const subcommand = args[0];
    const state = loadVirtualGitState();

    if (!subcommand) {
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'info', text: 'virtual git commands: init, status, add, commit, log, branch, checkout, remote, config, push, debug, version' },
      ]);
      return;
    }

    if (subcommand === 'version') {
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'info', text: 'SouthStack Git v3.3 (2026-03-08 with branch support)' },
      ]);
      return;
    }

    if (subcommand === 'debug') {
      const workingSnapshot = getWorkingSnapshot();
      const fileNames = Object.keys(workingSnapshot);
      const debugInfo = [
        '=== GIT DEBUG INFO ===',
        `Initialized: ${state.initialized ? 'YES' : 'NO'}`,
        `Current branch: ${state.currentBranch || 'main'}`,
        `All branches: ${(state.branches || ['main']).join(', ')}`,
        `Files in workspace: ${fileNames.length}`,
        fileNames.length > 0 ? `  Files: ${fileNames.join(', ')}` : '  (no files)',
        `Staged files: ${(state.staged || []).length}`,
        (state.staged || []).length > 0 ? `  Staged: ${state.staged.join(', ')}` : '  (none staged)',
        `Commits: ${(state.commits || []).length}`,
        `Remotes: ${Object.keys(state.remotes || {}).length}`,
        Object.keys(state.remotes || {}).length > 0 
          ? `  ${Object.entries(state.remotes || {}).map(([k,v]) => `${k}: ${v}`).join(', ')}`
          : '  (no remotes)',
        `Token set: ${state.github?.token ? 'YES' : 'NO'}`,
        `Current workspace: ${getActiveWorkspaceId()}`,
      ].join('\n');
      
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'info', text: debugInfo },
      ]);
      return;
    }

    if (subcommand === 'init') {
      if (state.initialized) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'info', text: 'Reinitialized existing SouthStack virtual Git repository' },
        ]);
        return;
      }

      const initializedState = {
        ...state,
        initialized: true,
      };
      saveVirtualGitState(initializedState);

      setTerminalOutput((prev) => [
        ...prev,
        { type: 'success', text: 'Initialized empty SouthStack virtual Git repository' },
      ]);
      return;
    }

    if (!state.initialized) {
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'error', text: "Not a git repository. Run 'git init' first." },
      ]);
      return;
    }

    if (subcommand === 'status') {
      const workingSnapshot = getWorkingSnapshot();
      const fileCount = Object.keys(workingSnapshot).length;
      const commitCount = (state.commits || []).length;
      const stagedCount = (state.staged || []).length;
      
      const statusText = renderVirtualGitStatus(state);
      const debugInfo = `\n[Debug: ${fileCount} files, ${stagedCount} staged, ${commitCount} commits]`;
      const fullStatus = fileCount === 0 
        ? 'No files in workspace yet. Create a file to get started.'
        : statusText + debugInfo;
      
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'info', text: fullStatus },
      ]);
      return;
    }

    if (subcommand === 'add') {
      const workingSnapshot = getWorkingSnapshot();
      const changedFiles = getChangedFilesAgainstHead(state.headSnapshot || {}, workingSnapshot);

      const fileCount = Object.keys(workingSnapshot).length;
      const allFileNames = Object.keys(workingSnapshot).join(', ');
      
      let filesToStage = [];
      const target = args[1];
      if (!target || target === '-A' || target === '.') {
        filesToStage = changedFiles;
      } else {
        filesToStage = args.slice(1).filter(Boolean);
      }

      if (filesToStage.length === 0 && fileCount === 0) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'info', text: 'No files in workspace. Create a file first (e.g., main.js)' },
        ]);
        return;
      }

      const staged = Array.from(new Set([...(state.staged || []), ...filesToStage]));
      saveVirtualGitState({ ...state, staged });

      const message = filesToStage.length > 0 
        ? `Staged ${filesToStage.length} file(s): ${filesToStage.join(', ')}\n[Debug: Total ${fileCount} files in workspace: ${allFileNames}]`
        : `No changes to stage (working tree clean)\n[Debug: ${fileCount} files exist: ${allFileNames}]`;
      
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'success', text: message },
      ]);
      return;
    }

    if (subcommand === 'commit') {
      const msgIndex = args.findIndex((arg) => arg === '-m');
      const message = msgIndex >= 0 ? args[msgIndex + 1] : '';

      if (!message) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: 'Usage: git commit -m "message"' },
        ]);
        return;
      }

      if (!state.staged || state.staged.length === 0) {
        const workingSnapshot = getWorkingSnapshot();
        const hasFiles = Object.keys(workingSnapshot).length > 0;
        const hint = hasFiles 
          ? 'Run: git add -A' 
          : 'Create files first, then: git add -A';
        
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `No staged changes. ${hint}` },
        ]);
        return;
      }

      const workingSnapshot = getWorkingSnapshot();
      const nextHead = { ...(state.headSnapshot || {}) };

      state.staged.forEach((file) => {
        if (workingSnapshot[file] === undefined) {
          delete nextHead[file];
        } else {
          nextHead[file] = workingSnapshot[file];
        }
      });

      const commitId = Date.now().toString(36).slice(-7);
      const commit = {
        id: commitId,
        message,
        timestamp: new Date().toISOString(),
        files: [...state.staged],
      };

      const nextState = {
        ...state,
        headSnapshot: nextHead,
        staged: [],
        commits: [...(state.commits || []), commit],
      };

      saveVirtualGitState(nextState);
      const totalCommits = nextState.commits.length;
      
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'success', text: `[${commitId}] ${message}` },
        { type: 'info', text: `${commit.files.length} file(s) committed. Total commits: ${totalCommits}` },
      ]);
      return;
    }

    if (subcommand === 'log') {
      const commits = [...(state.commits || [])].reverse();
      if (commits.length === 0) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'info', text: 'No commits yet. Run: git add -A && git commit -m "message"' },
        ]);
        return;
      }

      const text = commits
        .map((commit) => `commit ${commit.id}\nDate: ${new Date(commit.timestamp).toLocaleString()}\n\n    ${commit.message}\n    Files: ${commit.files.join(', ')}`)
        .join('\n\n');

      setTerminalOutput((prev) => [
        ...prev,
        { type: 'info', text: `${commits.length} commit(s):\n\n${text}` },
      ]);
      return;
    }

    if (subcommand === 'remote') {
      const remoteAction = args[1];

      if (!remoteAction || remoteAction === '-v') {
        const entries = Object.entries(state.remotes || {});
        if (entries.length === 0) {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'info', text: 'No remotes configured.' },
          ]);
          return;
        }

        const lines = entries.flatMap(([name, url]) => [
          `${name}\t${url} (fetch)`,
          `${name}\t${url} (push)`,
        ]);

        setTerminalOutput((prev) => [
          ...prev,
          { type: 'info', text: lines.join('\n') },
        ]);
        return;
      }

      if (remoteAction === 'add') {
        const remoteName = args[2];
        const remoteUrl = args[3];
        if (!remoteName || !remoteUrl) {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'error', text: 'Usage: git remote add <name> <url>' },
          ]);
          return;
        }

        if (state.remotes?.[remoteName]) {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'error', text: `remote ${remoteName} already exists.` },
          ]);
          return;
        }

        const nextState = {
          ...state,
          remotes: {
            ...(state.remotes || {}),
            [remoteName]: remoteUrl,
          },
        };
        saveVirtualGitState(nextState);
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'success', text: `Added remote ${remoteName} -> ${remoteUrl}` },
        ]);
        return;
      }

      if (remoteAction === 'remove' || remoteAction === 'rm') {
        const remoteName = args[2];
        if (!remoteName) {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'error', text: 'Usage: git remote remove <name>' },
          ]);
          return;
        }

        if (!state.remotes?.[remoteName]) {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'error', text: `remote ${remoteName} not found.` },
          ]);
          return;
        }

        const nextRemotes = { ...(state.remotes || {}) };
        delete nextRemotes[remoteName];
        saveVirtualGitState({ ...state, remotes: nextRemotes });

        setTerminalOutput((prev) => [
          ...prev,
          { type: 'success', text: `Removed remote ${remoteName}` },
        ]);
        return;
      }

      if (remoteAction === 'set-url') {
        const remoteName = args[2];
        const remoteUrl = args[3];
        if (!remoteName || !remoteUrl) {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'error', text: 'Usage: git remote set-url <name> <url>' },
          ]);
          return;
        }

        if (!state.remotes?.[remoteName]) {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'error', text: `remote ${remoteName} not found.` },
          ]);
          return;
        }

        saveVirtualGitState({
          ...state,
          remotes: {
            ...(state.remotes || {}),
            [remoteName]: remoteUrl,
          },
        });

        setTerminalOutput((prev) => [
          ...prev,
          { type: 'success', text: `Updated remote ${remoteName} -> ${remoteUrl}` },
        ]);
        return;
      }

      setTerminalOutput((prev) => [
        ...prev,
        { type: 'error', text: 'Supported remote commands: add, remove, set-url, -v' },
      ]);
      return;
    }

    if (subcommand === 'branch') {
      const branchName = args[1];
      
      if (!branchName) {
        const branches = state.branches || ['main'];
        const currentBranch = state.currentBranch || 'main';
        const branchList = branches.map(b => b === currentBranch ? `* ${b}` : `  ${b}`).join('\n');
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'info', text: branchList },
        ]);
        return;
      }

      if ((state.branches || []).includes(branchName)) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `Branch '${branchName}' already exists` },
        ]);
        return;
      }

      const nextBranches = [...(state.branches || ['main']), branchName];
      saveVirtualGitState({ ...state, branches: nextBranches });
      
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'success', text: `Created branch ${branchName}` },
      ]);
      return;
    }

    if (subcommand === 'checkout') {
      const branchName = args[1];
      
      if (!branchName) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: 'Usage: git checkout <branch>' },
        ]);
        return;
      }

      if (!(state.branches || []).includes(branchName)) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `Branch '${branchName}' does not exist. Create it with: git branch ${branchName}` },
        ]);
        return;
      }

      saveVirtualGitState({ ...state, currentBranch: branchName });
      
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'success', text: `Switched to branch '${branchName}'` },
      ]);
      return;
    }

    if (subcommand === 'config') {
      const key = args[1];
      const value = args[2];

      if (!key) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'info', text: 'Supported config keys: github.token, github.branch. Usage: git config <key> <value>' },
        ]);
        return;
      }

      if (key === '--get') {
        const getKey = args[2];
        if (!getKey) {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'error', text: 'Usage: git config --get <key>' },
          ]);
          return;
        }

        if (getKey === 'github.token') {
          const hasToken = !!state.github?.token;
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'info', text: hasToken ? '[set]' : '[not set]' },
          ]);
          return;
        }

        if (getKey === 'github.branch') {
          setTerminalOutput((prev) => [
            ...prev,
            { type: 'info', text: state.github?.branch || 'main' },
          ]);
          return;
        }

        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `Unsupported config key: ${getKey}` },
        ]);
        return;
      }

      if (!value) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: 'Usage: git config <key> <value>' },
        ]);
        return;
      }

      if (key !== 'github.token' && key !== 'github.branch') {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `Unsupported config key: ${key}` },
        ]);
        return;
      }

      const nextState = {
        ...state,
        github: {
          ...(state.github || {}),
          [key.split('.')[1]]: value,
        },
      };
      saveVirtualGitState(nextState);

      setTerminalOutput((prev) => [
        ...prev,
        { type: 'success', text: `${key} updated` },
      ]);
      return;
    }

    if (subcommand === 'push') {
      const remoteName = args[1] || 'origin';
      const remoteUrl = state.remotes?.[remoteName];
      const branch = args[2] || state.currentBranch || state.github?.branch || 'main';
      const token = state.github?.token || '';
      
      // Debug state at push time
      const commitCount = (state.commits || []).length;
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'info', text: `[Push] Found ${commitCount} commits, pushing to branch '${branch}'` },
      ]);

      if (!remoteUrl) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `No remote '${remoteName}' configured. Use: git remote add ${remoteName} <url>` },
        ]);
        return;
      }

      if (!token) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: 'GitHub token not set. Use: git config github.token <your_token>' },
        ]);
        return;
      }

      const workingSnapshot = getWorkingSnapshot();
      if (Object.keys(workingSnapshot).length === 0) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: 'No files in workspace. Create files before pushing.' },
        ]);
        return;
      }

      if (commitCount === 0) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: 'No commits in state! Try: git debug (then refresh if needed)' },
        ]);
        return;
      }

      const lastCommit = state.commits[state.commits.length - 1];
      const commitMessage = lastCommit.message;

      setTerminalOutput((prev) => [
        ...prev,
        { type: 'info', text: `Pushing ${commitCount} commit(s) to ${remoteName}/${branch}...` },
      ]);

      try {
        const result = await pushToGithubApi({
          remoteUrl,
          token,
          branch,
          commitMessage,
        });

        setTerminalOutput((prev) => [
          ...prev,
          { type: 'success', text: `Pushed to https://github.com/${result.owner}/${result.repo} on branch ${result.branch}` },
          { type: 'info', text: `Commit: ${result.commitSha}` },
        ]);
      } catch (pushError) {
        console.error('[Push Error]', pushError);
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `Push failed: ${pushError.message || pushError}` },
          { type: 'info', text: `Remote: ${remoteUrl}, Branch: ${branch}` },
        ]);
      }
      return;
    }

    setTerminalOutput((prev) => [
      ...prev,
      { type: 'error', text: `Unsupported virtual git command: ${subcommand}` },
    ]);
  };

  const syncWorkspaceFilesToContainer = async () => {
    const fileNames = getFileNames();
    for (const name of fileNames) {
      const file = files[name];
      if (!file) continue;

      const directory = name.includes('/') ? name.split('/').slice(0, -1).join('/') : '';
      if (directory) {
        await createDirectory(directory);
      }

      await writeFile(name, file.content || '');
    }
  };

  const runShellCommand = async (rawInput) => {
    const commandLine = (rawInput || '').trim();
    if (!commandLine) {
      return;
    }

    setTerminalOutput((prev) => [
      ...prev,
      { type: 'input', text: `$ ${commandLine}` },
    ]);

    if (commandLine === 'clear') {
      setTerminalOutput([]);
      return;
    }

    if (commandLine === 'help') {
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'info', text: 'Shell commands enabled. Examples: git init, git status, git add -A, git commit -m "msg", git push' },
      ]);
      return;
    }

    if (!isBooted) {
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'error', text: 'WebContainer must be ready before terminal commands.' },
      ]);
      return;
    }

    if (isShellBusy) {
      return;
    }

    setIsShellBusy(true);

    const tokenized = commandLine.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const [command, ...args] = tokenized.map((token) => token.replace(/^"|"$/g, ''));

    if (!command) {
      setIsShellBusy(false);
      return;
    }

    if (command === 'git') {
      try {
        await runVirtualGitCommand(args);
      } catch (error) {
        console.error('[Git Error]', error);
        setTerminalOutput((prev) => [
          ...prev,
          { type: 'error', text: `❌ ${error.message || error}` },
          { type: 'info', text: 'Run "git debug" to see your git state' },
        ]);
      } finally {
        setIsShellBusy(false);
      }
      return;
    }

    setTerminalOutput((prev) => [
      ...prev,
      { type: 'info', text: `⚙️ Running: ${command} ${args.join(' ')}`.trim() },
    ]);

    try {
      await syncWorkspaceFilesToContainer();

      const process = await runCommand(command, args);
      const outputPromise = readProcessOutput(process);
      const exitCode = await process.exit;
      const output = (await outputPromise).trim();

      if (output) {
        setTerminalOutput((prev) => [
          ...prev,
          { type: exitCode === 0 ? 'success' : 'error', text: output },
        ]);
      }

      setTerminalOutput((prev) => [
        ...prev,
        { type: exitCode === 0 ? 'success' : 'error', text: exitCode === 0 ? '✅ Command complete' : `❌ Command exited with code ${exitCode}` },
      ]);
    } catch (error) {
      setTerminalOutput((prev) => [
        ...prev,
        { type: 'error', text: `❌ Command failed: ${error.message}` },
      ]);
    } finally {
      setIsShellBusy(false);
    }
  };

  const workspaceList = workspace?.getWorkspaceList?.() ?? [];
  const resolvedWorkspaceProps = {
    workspaces: workspaceList.length > 0
      ? workspaceList
      : [{ id: 'default', name: 'Default Project', fileCount: getFileNames().length }],
    currentWorkspaceId: workspace?.currentWorkspaceId || 'default',
    onSwitchWorkspace: workspace?.switchWorkspace || (() => {}),
    onCreateWorkspace: workspace?.createWorkspace || (() => {}),
    onDeleteWorkspace: workspace?.deleteWorkspace || (() => false),
    onRenameWorkspace: workspace?.renameWorkspace || (() => false),
  };

  if (showLanding) {
    return <LandingPage />;
  }

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
      workspaceProps={resolvedWorkspaceProps}
      mobileFilePanel={
        <FileExplorer
          fileNames={getFileNames()}
          currentFile={currentFile}
          onFileSelect={handleFileSelect}
          onFileCreate={handleFileCreate}
          onFileDelete={deleteFile}
          onFileRename={renameFile}
          workspaceProps={resolvedWorkspaceProps}
        />
      }
      mobileAIPanel={
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
              shellEnabled={true}
              shellBusy={isShellBusy}
              shellReady={isBooted}
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
