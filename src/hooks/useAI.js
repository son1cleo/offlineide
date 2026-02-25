import { useState, useEffect, useCallback, useRef } from 'react';
import * as webllm from '@mlc-ai/web-llm';

/**
 * Custom hook for managing local AI model (WebLLM)
 * Provides code completion and chat functionality
 * @returns {Object} AI state and methods
 */
export function useAI() {
  const [engine, setEngine] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const engineRef = useRef(null);

  // Model configuration - using a small, fast coder model
  const MODEL_ID = 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC';

  /**
   * Initialize the AI model
   * Downloads and loads the model on first use
   */
  const initializeAI = useCallback(async () => {
    if (engineRef.current || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('🤖 Initializing AI model...');

      // Create engine with progress callback
      const newEngine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (progress) => {
          setLoadingProgress(Math.round(progress.progress * 100));
          setLoadingStatus(progress.text || 'Loading model...');
          console.log(`📥 ${progress.text}: ${Math.round(progress.progress * 100)}%`);
        },
      });

      engineRef.current = newEngine;
      setEngine(newEngine);
      setIsReady(true);
      setIsLoading(false);
      console.log('✅ AI model ready!');
    } catch (err) {
      console.error('❌ AI initialization failed:', err);
      setError(err.message || 'Failed to load AI model');
      setIsLoading(false);
    }
  }, [isLoading]);

  /**
   * Generate code completion
   * @param {string} code - Current code context
   * @param {string} prompt - User prompt/instruction
   * @returns {Promise<string>} Generated completion
   */
  const generateCompletion = useCallback(async (code, prompt) => {
    if (!engineRef.current) {
      throw new Error('AI model not initialized');
    }

    try {
      const systemPrompt = `You are a helpful coding assistant. Provide concise, accurate code completions and suggestions. Output only code without explanations unless asked.`;
      
      const userPrompt = `Context:\n\`\`\`javascript\n${code}\n\`\`\`\n\nTask: ${prompt}\n\nProvide the code:`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const reply = await engineRef.current.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 512,
      });

      return reply.choices[0]?.message?.content || '';
    } catch (err) {
      console.error('❌ Completion error:', err);
      throw err;
    }
  }, []);

  /**
   * Chat with AI (streaming response)
   * @param {Array} messages - Chat history
   * @param {Function} onChunk - Callback for each token
   * @returns {Promise<string>} Full response
   */
  const chat = useCallback(async (messages, onChunk) => {
    if (!engineRef.current) {
      throw new Error('AI model not initialized');
    }

    try {
      const chunks = await engineRef.current.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          if (onChunk) {
            onChunk(content);
          }
        }
      }

      return fullResponse;
    } catch (err) {
      console.error('❌ Chat error:', err);
      throw err;
    }
  }, []);

  /**
   * Explain code
   * @param {string} code - Code to explain
   * @returns {Promise<string>} Explanation
   */
  const explainCode = useCallback(async (code) => {
    if (!engineRef.current) {
      throw new Error('AI model not initialized');
    }

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful coding teacher. Explain code clearly and concisely.',
        },
        {
          role: 'user',
          content: `Explain this code:\n\`\`\`javascript\n${code}\n\`\`\``,
        },
      ];

      const reply = await engineRef.current.chat.completions.create({
        messages,
        temperature: 0.5,
        max_tokens: 512,
      });

      return reply.choices[0]?.message?.content || '';
    } catch (err) {
      console.error('❌ Explain error:', err);
      throw err;
    }
  }, []);

  /**
   * Fix code issues
   * @param {string} code - Code with issues
   * @param {string} error - Error message
   * @returns {Promise<string>} Fixed code
   */
  const fixCode = useCallback(async (code, error) => {
    if (!engineRef.current) {
      throw new Error('AI model not initialized');
    }

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful coding assistant. Fix code issues and return only the corrected code.',
        },
        {
          role: 'user',
          content: `Fix this code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nError: ${error}\n\nProvide the fixed code:`,
        },
      ];

      const reply = await engineRef.current.chat.completions.create({
        messages,
        temperature: 0.3,
        max_tokens: 512,
      });

      return reply.choices[0]?.message?.content || '';
    } catch (err) {
      console.error('❌ Fix error:', err);
      throw err;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        console.log('🧹 Cleaning up AI model...');
        // WebLLM doesn't require explicit cleanup
      }
    };
  }, []);

  return {
    engine,
    isLoading,
    isReady,
    error,
    loadingProgress,
    loadingStatus,
    initializeAI,
    generateCompletion,
    chat,
    explainCode,
    fixCode,
  };
}
