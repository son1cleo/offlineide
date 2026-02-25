# SouthStack - Offline-First AI IDE

An offline-first AI-powered IDE that runs entirely inside the browser.

## Features

- 🖥️ Full Monaco code editor
- 🤖 Local AI assistance (WebLLM)
- 🚀 Node.js runtime in browser (WebContainers)
- 💾 Local storage (IndexedDB)
- 📡 Works completely offline
- 🔒 No API keys or backend required

## Tech Stack

- **Frontend**: React + Vite
- **Editor**: Monaco Editor
- **Runtime**: WebContainers API
- **AI**: WebLLM (Qwen2.5-Coder)
- **Storage**: IndexedDB
- **Offline**: PWA

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## System Requirements

- Modern browser with WebGPU support (Chrome/Edge recommended)
- Minimum 8GB RAM recommended
- Chromium-based browser preferred
- Cross-origin isolation enabled (COOP/COEP headers)

## Features Overview

### v1 (Current) ✅
- **Code Editing**: Full-featured Monaco editor with syntax highlighting
- **File Management**: Create, rename, delete files with automatic saving
- **Code Execution**: Run JavaScript/Node.js code in WebContainer
- **Local AI**: Code completion and chat with Qwen2.5-Coder model
- **Persistent Storage**: IndexedDB-based file persistence
- **Terminal**: Real-time output from executed code
- **Offline First**: Works completely without internet connection
- **No API Keys**: All processing happens locally

### How It Works

1. **Editor**: Write code in the Monaco editor with full syntax highlighting
2. **File System**: Files are stored locally in IndexedDB and never leave your browser
3. **Execution**: Click "Run Code" to execute JavaScript files in WebContainer
4. **AI Chat**: Use the AI panel to ask for code help, explanations, or generate code
5. **Terminal**: View execution output in the integrated terminal

### Keyboard Shortcuts

- `Ctrl+Enter` or `Cmd+Enter`: Run Code
- `Shift+Enter` in chat: Send message without newline

### First Time Setup

The first time you initialize the AI model, it will download ~900MB. Subsequent loads are instant (cached locally).

## v1 Roadmap (Completed) ✅

- [x] Setup base React project with Vite
- [x] Integrate Monaco editor with syntax highlighting
- [x] Integrate WebContainers for Node.js runtime
- [x] Implement file system layer with IndexedDB persistence
- [x] Integrate WebLLM for local AI model (Qwen2.5-Coder)
- [x] Connect AI to editor for code completion
- [x] Implement AI chat panel for code assistance
- [x] Add terminal for execution output
- [x] Create file explorer with CRUD operations
- [x] Auto-save functionality

## Future Roadmap (v2+)

- [ ] Support for Python, TypeScript, etc.
- [ ] Syntax error highlighting and linting
- [ ] Larger AI models with better capabilities
- [ ] Project workspace support
- [ ] Git integration
- [ ] PWA support
- [ ] Collaborative editing
- [ ] Code snippets library

## Troubleshooting

### WebContainer not initializing
- Ensure your browser supports WebContainers (Chrome/Edge 94+)
- Check browser console for cross-origin isolation errors
- Try refreshing the page

### AI model not loading
- Ensure you have a stable internet connection for the initial download
- Check your browser's storage quota
- Try clearing browser cache and reloading
- Requires at least 8GB free RAM

### Code not running
- WebContainer must finish booting (check status indicator)
- Check browser console for error messages
- Ensure the code doesn't require external packages

## License

MIT

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.
