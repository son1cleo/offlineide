# SouthForge - Offline-First AI IDE

SouthForge is an offline-first, browser-based IDE with local AI support, in-browser runtime execution, workspace persistence, and terminal-driven Git/GitHub flows.

## Current Version

`v3.3`

## Highlights (v3.3)

- Local-first IDE experience with React + Monaco + WebContainers
- Multi-language editing and execution (JS/TS/Python/Go/Bash)
- Workspace persistence via IndexedDB with workspace switching support
- Interactive terminal (stdin/stdout) for running code and shell commands
- Terminal-first virtual Git workflow (`git init`, `status`, `add`, `commit`, `log`, `remote`, `config`, `push`, `branch`, `checkout`)
- GitHub push integration from inside the app terminal
- New landing intro sequence:
  - static dark modern background
  - lightning burst
  - logo reveal
  - automatic IDE handoff

## Tech Stack

- Frontend: React + Vite
- Editor: Monaco Editor
- Runtime: WebContainers API
- AI: WebLLM (Qwen2.5-Coder)
- Storage: IndexedDB
- Deployment: Vercel

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Core Features

### 1) Editor and Execution

- Monaco editor with language-aware editing
- Run code directly in-browser using WebContainers
- Interactive terminal input for programs that require stdin

### 2) Workspaces and Files

- Create, switch, rename, and delete workspaces
- File CRUD support with local persistence
- Auto-save behavior through local storage/indexed data

### 3) AI Assistance

- Local AI chat and code assistance
- No external API key required for core local model flow

### 4) Terminal Git + GitHub

SouthForge uses a terminal-first Git workflow inside the app.

Supported command families:

- `git init`
- `git status`
- `git add`
- `git commit`
- `git log`
- `git remote`
- `git config` (includes GitHub token/branch config)
- `git push`
- `git branch`
- `git checkout`
- `git debug`

## Landing Experience

The app starts with a branded intro (every visit):

1. Lightning burst
2. Logo reveal
3. IDE turns on

Theme: dark electric-blue, modern, static background.

## Recommended Workflow (Protected Main)

1. Create a feature branch (example: `v4`)
2. Implement changes on that branch
3. Push branch and open PR
4. Merge to `main` via review flow

## System Requirements

- Chromium-based browser recommended (Chrome/Edge)
- WebGPU-capable modern browser recommended for best AI performance
- Adequate RAM for local model loading
- Cross-origin isolation support for WebContainers

## License

MIT
