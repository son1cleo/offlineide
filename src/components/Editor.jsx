import { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './Editor.css';

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
  const completionDisposableRef = useRef(null);

  useEffect(() => {
    return () => {
      if (completionDisposableRef.current) {
        completionDisposableRef.current.dispose();
        completionDisposableRef.current = null;
      }
    };
  }, []);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
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
