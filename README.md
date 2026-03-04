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

### v2 (Current - Multi-Language) ✨
- **Multi-Language Support**: JavaScript, TypeScript, Python, Go, Bash, HTML, JSON
- **Interactive Terminal**: Real-time stdin/stdout with user input support
- **Code Editing**: Full-featured Monaco editor with syntax highlighting
- **File Management**: Create, rename, delete files with automatic saving
- **Code Execution**: Run code in multiple languages via WebContainers
- **Auto-Detection**: Language detected from file extension
- **Interactive Programs**: Full support for input(), readline, read commands
- **Local AI**: Code completion and chat with Qwen2.5-Coder model
- **Persistent Storage**: IndexedDB-based file persistence
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Offline First**: Works completely without internet connection
- **No API Keys**: All processing happens locally

### Supported Languages

| Language | Extension | Runtime | Interactive | Status |
|----------|-----------|---------|-------------|--------|
| JavaScript | `.js` | Node.js | ✅ Yes | ✅ Ready |
| TypeScript | `.ts` | ts-node | ✅ Yes | ✅ Ready |
| Python | `.py` | Python 3 | ✅ Yes | ✅ Ready |
| Go | `.go` | golang | ✅ Yes | ✅ Ready |
| Bash | `.sh` | bash | ✅ Yes | ✅ Ready |
| JSON | `.json` | - | ➖ N/A | 📄 Read-only |
| HTML | `.html` | - | ➖ N/A | 🌐 Display-only |

### How It Works

1. **Editor**: Write code in the Monaco editor with full syntax highlighting
2. **Language Auto-Detection**: Language is automatically detected from file extension
3. **File System**: Files are stored locally in IndexedDB and never leave your browser
4. **Execution**: Click "Run Code" to execute code in the appropriate runtime
5. **Interactive Terminal**: Type input directly in the terminal when programs need it
6. **AI Chat**: Use the AI panel to ask for code help, explanations, or generate code
7. **Real-time Streaming**: View execution output as it happens

### Interactive Terminal Features 🎯

The terminal now supports **fully interactive programs**:

- ✅ **Real-time user input** - Type responses when programs need input
- ✅ **stdin forwarding** - Input is sent directly to the running process
- ✅ **stdout/stderr streaming** - Output appears instantly as it's generated
- ✅ **No freezing** - Terminal stays responsive while waiting for input
- ✅ **Multi-language** - Works with Python `input()`, Node.js `readline`, Bash `read`, etc.
- ✅ **Input echo** - Your typed input is displayed with a `›` prompt
- ✅ **Visual indicators** - "Waiting for input..." status when program expects input
- ✅ **Process control** - Stop button to terminate long-running or stuck processes

**Try it out:** Open any file in `/examples/` to test interactive programs!

Examples:
- `examples/interactive-python.py` - Python with multiple input() calls
- `examples/interactive-node.js` - Node.js readline interface
- `examples/interactive-bash.sh` - Bash script with read commands

### Keyboard Shortcuts

- `Ctrl+Enter` or `Cmd+Enter`: Run Code
- `Shift+Enter` in chat: Send message without newline

### First Time Setup

The first time you initialize the AI model, it will download ~900MB. Subsequent loads are instant (cached locally).

For TypeScript: Dependencies are automatically installed on first run.

## v2 Roadmap (In Progress) 🚀

- [x] Multi-language support (JavaScript, TypeScript, Python, Go, Bash)
- [x] Language auto-detection from file extensions
- [x] Responsive design for all screen sizes
- [x] Interactive terminal with stdin/stdout support
- [x] Real-time user input handling
- [ ] Syntax error highlighting and linting
- [ ] Larger AI models with better capabilities
- [ ] Project workspace support
- [ ] Git integration
- [ ] PWA support
- [ ] Collaborative editing
- [ ] Code snippets library

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

## Future Roadmap (v3+)

- [ ] Support for more languages (Rust, C++, Java, etc.)
- [ ] Advanced debugger
- [ ] Package manager integration
- [ ] Extension system
- [ ] Theme customization
- [ ] Collaborative debugging

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
