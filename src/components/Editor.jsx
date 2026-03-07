import { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './Editor.css';

/**
 * Validate Python code for common syntax errors
 * @param {string} code - Python code to validate
 * @returns {Array} Array of error objects with line, column, and message
 */
function validatePythonSyntax(code) {
  const errors = [];
  const lines = code.split('\n');
  
  // Track bracket/paren/brace counts
  let openBrackets = 0;
  let openParens = 0;
  let openBraces = 0;
  let inString = false;
  let stringChar = null;
  
  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;
    const trimmedLine = line.trim();
    
    // Check for mixing tabs and spaces (common Python error)
    if (line.match(/^\t/) && code.includes('    ')) {
      errors.push({
        line: lineNum,
        column: 1,
        message: 'Inconsistent use of tabs and spaces in indentation',
        severity: 'warning'
      });
    }
    
    // Check for unclosed strings on single line
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const prevChar = i > 0 ? line[i - 1] : '';
      
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (inString && char === stringChar) {
          inString = false;
          stringChar = null;
        } else if (!inString) {
          inString = true;
          stringChar = char;
        }
      }
    }
    
    // Count brackets/parens/braces (ignoring strings)
    if (!inString) {
      openBrackets += (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
      openParens += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      openBraces += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    }
    
    // Check for colon at end of control structures
    if (trimmedLine.match(/^(if|elif|else|for|while|def|class|try|except|finally|with)\b/) && 
        !trimmedLine.endsWith(':') && 
        !trimmedLine.endsWith('\\')) {
      errors.push({
        line: lineNum,
        column: line.length,
        message: 'Expected ":" at end of statement',
        severity: 'error'
      });
    }
    
    // Check for common syntax errors
    if (trimmedLine.match(/^(if|elif|while)\s*$/)) {
      errors.push({
        line: lineNum,
        column: 1,
        message: 'Expected condition after statement',
        severity: 'error'
      });
    }
    
    // Check for invalid def/class declarations
    if (trimmedLine.match(/^def\s+\w+\s*(?!\()/)) {
      errors.push({
        line: lineNum,
        column: trimmedLine.indexOf('def') + 1,
        message: 'Function definition must include parentheses',
        severity: 'error'
      });
    }
  });
  
  // Check for unclosed brackets/parens at end of file
  if (openBrackets > 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `Unclosed bracket: ${openBrackets} "[" not closed`,
      severity: 'error'
    });
  }
  
  if (openParens > 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `Unclosed parenthesis: ${openParens} "(" not closed`,
      severity: 'error'
    });
  }
  
  if (openBraces > 0) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `Unclosed brace: ${openBraces} "{" not closed`,
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Editor Component
 * Monaco-based code editor with syntax highlighting
 * @param {Object} props - Component props
 * @param {string} props.code - Initial code content
 * @param {Function} props.onChange - Callback when code changes
 * @param {string} props.language - Programming language (default: javascript)
 * @param {Function} props.onRequestCompletion - Callback to request AI completion
 * @param {boolean} props.aiReady - Whether AI model is ready
 * @param {boolean} props.aiLoading - Whether AI model is loading
 */
function Editor({ code, onChange, language = 'javascript', onRequestCompletion, aiReady = false, aiLoading = false }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const completionDisposableRef = useRef(null);
  const validationTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (completionDisposableRef.current) {
        completionDisposableRef.current.dispose();
        completionDisposableRef.current = null;
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Run syntax validation for Python and other languages
  const runSyntaxValidation = (editor, monaco, code, lang) => {
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    // Clear existing markers
    monaco.editor.setModelMarkers(model, 'syntax', []);

    // Only validate Python for now (JS/TS have built-in validation)
    if (lang === 'python') {
      const errors = validatePythonSyntax(code);
      
      const markers = errors.map(error => ({
        startLineNumber: error.line,
        endLineNumber: error.line,
        startColumn: error.column,
        endColumn: 1000, // Highlight whole line
        message: error.message,
        severity: error.severity === 'error' 
          ? monaco.MarkerSeverity.Error 
          : monaco.MarkerSeverity.Warning,
        source: 'Python Syntax Checker'
      }));

      monaco.editor.setModelMarkers(model, 'syntax', markers);
    }
  };

  // Debounced validation on code change
  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      if (editorRef.current && monacoRef.current) {
        runSyntaxValidation(editorRef.current, monacoRef.current, code, language);
      }
    }, 500); // Wait 500ms after typing stops

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [code, language]);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure Monaco editor theme and options
    monaco.editor.defineTheme('southstack-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7681' },
        { token: 'keyword', foreground: '1f6feb' },
        { token: 'string', foreground: 'a5d6ff' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editorCursor.foreground': '#58a6ff',
        'editor.selectionBackground': '#1f6feb40',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#58a6ff',
        'editor.inactiveSelectionBackground': '#1f6feb20',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
      },
    });
    
    monaco.editor.setTheme('southstack-dark');

    // Enable JavaScript/TypeScript validation
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [1108], // Ignore "return statement can only be used within a function body"
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Configure JavaScript compiler options for better error detection
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      allowJs: true,
      checkJs: false, // Don't be too strict for JS
    });

    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      strict: true,
    });

    // Run initial validation
    runSyntaxValidation(editor, monaco, code, language);

    if (completionDisposableRef.current) {
      completionDisposableRef.current.dispose();
      completionDisposableRef.current = null;
    }

    completionDisposableRef.current = monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['.', '(', ' ', '='],
      provideCompletionItems: async (model, position) => {
        if (!onRequestCompletion || !aiReady || aiLoading) {
          return { suggestions: [] };
        }

        const codeUpToCursor = model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 40),
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const prompt = 'Complete the next line or expression based on the context.';

        try {
          const completion = await onRequestCompletion(codeUpToCursor, prompt);
          const text = (completion || '').trim();

          if (!text) {
            return { suggestions: [] };
          }

          return {
            suggestions: [
              {
                label: 'AI Suggestion',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: text,
                range: new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
                ),
                detail: 'AI Completion',
              },
            ],
          };
        } catch (error) {
          console.error('AI completion error:', error);
          return { suggestions: [] };
        }
      },
    });

    // Focus editor on mount
    editor.focus();
  };

  // Handle editor value change
  const handleEditorChange = (value) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="editor-container">
      <MonacoEditor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          fontLigatures: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          // Performance optimizations
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          // Accessibility
          accessibilitySupport: 'auto',
          // Syntax error detection features
          glyphMargin: true, // Show icons for errors/warnings in margin
          lightbulb: {
            enabled: true, // Show lightbulb for quick fixes
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
        }}
        loading={
          <div className="editor-loading">
            <div className="loading-spinner"></div>
            <p>Loading editor...</p>
          </div>
        }
      />
    </div>
  );
}

export default Editor;
