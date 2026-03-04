/**
 * Language support utilities for SouthStack IDE
 * Defines supported languages, file types, and execution commands
 */

export const SUPPORTED_LANGUAGES = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    monacoId: 'javascript',
    extensions: ['.js', '.mjs', '.cjs'],
    defaultExtension: '.js',
    runCommand: 'node',
    requires: [],
    icon: '⚡',
    description: 'JavaScript (Node.js)',
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    monacoId: 'typescript',
    extensions: ['.ts', '.tsx'],
    defaultExtension: '.ts',
    runCommand: 'npx',
    runArgs: ['ts-node', '--transpile-only'],
    requires: ['typescript', 'ts-node'],
    icon: '🔷',
    description: 'TypeScript',
  },
  python: {
    id: 'python',
    name: 'Python',
    monacoId: 'python',
    extensions: ['.py'],
    defaultExtension: '.py',
    runCommand: 'python3',
    runArgs: ['-u'], // Unbuffered output for real-time streaming
    requires: [],
    icon: '🐍',
    description: 'Python 3',
  },
  go: {
    id: 'go',
    name: 'Go',
    monacoId: 'go',
    extensions: ['.go'],
    defaultExtension: '.go',
    runCommand: 'go',
    runArgs: ['run'],
    requires: [],
    icon: '🐹',
    description: 'Go (Golang)',
  },
  bash: {
    id: 'bash',
    name: 'Bash/Shell',
    monacoId: 'shell',
    extensions: ['.sh', '.bash'],
    defaultExtension: '.sh',
    runCommand: 'bash',
    requires: [],
    icon: '🐚',
    description: 'Bash Shell Script',
  },
  json: {
    id: 'json',
    name: 'JSON',
    monacoId: 'json',
    extensions: ['.json'],
    defaultExtension: '.json',
    runCommand: null, // Not executable
    icon: '{}',
    description: 'JSON Data',
  },
  html: {
    id: 'html',
    name: 'HTML',
    monacoId: 'html',
    extensions: ['.html', '.htm'],
    defaultExtension: '.html',
    runCommand: null, // Browser only
    icon: '🌐',
    description: 'HTML Markup',
  },
};

/**
 * Get language configuration by ID
 */
export function getLanguageById(languageId) {
  return SUPPORTED_LANGUAGES[languageId] || SUPPORTED_LANGUAGES.javascript;
}

/**
 * Detect language from file extension
 */
export function getLanguageFromExtension(filename) {
  if (!filename) return SUPPORTED_LANGUAGES.javascript;

  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  for (const language of Object.values(SUPPORTED_LANGUAGES)) {
    if (language.extensions.includes(ext)) {
      return language;
    }
  }

  return SUPPORTED_LANGUAGES.javascript;
}

/**
 * Get file extension for a language
 */
export function getFileExtensionForLanguage(languageId) {
  const language = getLanguageById(languageId);
  return language.defaultExtension;
}

/**
 * Check if a language is executable
 */
export function isExecutableLanguage(languageId) {
  const language = getLanguageById(languageId);
  return language.runCommand !== null && language.runCommand !== undefined;
}

/**
 * Get all executable languages
 */
export function getExecutableLanguages() {
  return Object.values(SUPPORTED_LANGUAGES).filter(
    (lang) => lang.runCommand !== null && lang.runCommand !== undefined
  );
}

/**
 * Get all available languages
 */
export function getAllLanguages() {
  return Object.values(SUPPORTED_LANGUAGES);
}

/**
 * Get execution command for a language
 */
export function getExecutionCommand(languageId, filename) {
  const language = getLanguageById(languageId);

  if (!language.runCommand) {
    throw new Error(`Language ${languageId} is not executable`);
  }

  const args = language.runArgs
    ? [...language.runArgs, filename]
    : [filename];

  return {
    command: language.runCommand,
    args,
    timeout: 30000, // 30 seconds default timeout
  };
}

/**
 * Get setup commands required before executing (e.g., npm install)
 */
export function getSetupCommands(languageId) {
  const language = getLanguageById(languageId);

  if (!language.requires || language.requires.length === 0) {
    return [];
  }

  // For TypeScript, ensure ts-node and typescript are installed
  if (languageId === 'typescript') {
    return [
      {
        command: 'npm',
        args: ['install', '--save-dev', 'typescript', 'ts-node', '@types/node'],
        description: 'Installing TypeScript dependencies...',
      },
    ];
  }

  // For Go, it should be available in most Linux environments
  // If not, we'll get an error when trying to run
  if (languageId === 'go') {
    return [];
  }

  return [];
}
