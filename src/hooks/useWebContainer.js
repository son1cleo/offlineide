import { useState, useEffect, useCallback, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';

/**
 * Custom hook for managing WebContainer instance
 * Provides methods to interact with the in-browser Node.js runtime
 * @returns {Object} WebContainer state and methods
 */
export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBooted, setIsBooted] = useState(false);
  const bootingRef = useRef(false);
  const instanceRef = useRef(null);

  const bootContainer = useCallback(async () => {
    if (bootingRef.current || instanceRef.current) {
      return;
    }

    if (!window.crossOriginIsolated) {
      setError('WebContainer requires cross-origin isolation. Please use COOP/COEP headers and reload.');
      setIsLoading(false);
      return;
    }

    try {
      bootingRef.current = true;
      setIsLoading(true);
      setError(null);
      console.log('🚀 Booting WebContainer...');

      const instance = await WebContainer.boot();
      instanceRef.current = instance;
      setWebcontainer(instance);
      setIsBooted(true);
      setIsLoading(false);
      console.log('✅ WebContainer ready');
    } catch (err) {
      console.error('❌ WebContainer boot failed:', err);
      setError(err.message);
      setIsLoading(false);
    } finally {
      bootingRef.current = false;
    }
  }, []);

  // Boot WebContainer on mount
  useEffect(() => {
    let mounted = true;

    const bootIfMounted = async () => {
      if (!mounted) {
        return;
      }
      await bootContainer();
    };

    bootIfMounted();

    return () => {
      mounted = false;
    };
  }, [bootContainer]);

  const retryBoot = useCallback(async () => {
    if (bootingRef.current) {
      return;
    }
    setError(null);
    setIsLoading(true);
    await bootContainer();
  }, [bootContainer]);

  /**
   * Write a file to the WebContainer filesystem
   * @param {string} path - File path
   * @param {string} content - File content
   */
  const writeFile = useCallback(async (path, content) => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }
    
    try {
      await webcontainer.fs.writeFile(path, content);
      console.log(`📝 File written: ${path}`);
    } catch (err) {
      console.error(`❌ Failed to write file ${path}:`, err);
      throw err;
    }
  }, [webcontainer]);

  /**
   * Read a file from the WebContainer filesystem
   * @param {string} path - File path
   * @returns {Promise<string>} File content
   */
  const readFile = useCallback(async (path) => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }
    
    try {
      const content = await webcontainer.fs.readFile(path, 'utf-8');
      console.log(`📖 File read: ${path}`);
      return content;
    } catch (err) {
      console.error(`❌ Failed to read file ${path}:`, err);
      throw err;
    }
  }, [webcontainer]);

  /**
   * Create a directory in the WebContainer filesystem
   * @param {string} path - Directory path
   */
  const createDirectory = useCallback(async (path) => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }
    
    try {
      await webcontainer.fs.mkdir(path, { recursive: true });
      console.log(`📁 Directory created: ${path}`);
    } catch (err) {
      console.error(`❌ Failed to create directory ${path}:`, err);
      throw err;
    }
  }, [webcontainer]);

  /**
   * Run a command in the WebContainer
   * @param {string} command - Command to execute
   * @param {Array<string>} args - Command arguments
   * @returns {Promise<Object>} Process object
   */
  const runCommand = useCallback(async (command, args = []) => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }
    
    try {
      console.log(`⚡ Running: ${command} ${args.join(' ')}`);
      const process = await webcontainer.spawn(command, args);
      return process;
    } catch (err) {
      console.error(`❌ Failed to run command:`, err);
      throw err;
    }
  }, [webcontainer]);

  /**
   * Mount files to the WebContainer filesystem
   * @param {Object} files - File tree object
   */
  const mountFiles = useCallback(async (files) => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }
    
    try {
      await webcontainer.mount(files);
      console.log('📦 Files mounted to WebContainer');
    } catch (err) {
      console.error('❌ Failed to mount files:', err);
      throw err;
    }
  }, [webcontainer]);

  /**
   * Get server URL for running web servers
   * @param {number} port - Server port
   * @returns {Promise<string>} Server URL
   */
  const getServerUrl = useCallback(async (port) => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }
    
    try {
      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      const url = await webcontainer.on('server-ready', (port, url) => url);
      return url;
    } catch (err) {
      console.error('❌ Failed to get server URL:', err);
      throw err;
    }
  }, [webcontainer]);

  return {
    webcontainer,
    isLoading,
    isBooted,
    error,
    retryBoot,
    writeFile,
    readFile,
    createDirectory,
    runCommand,
    mountFiles,
    getServerUrl,
  };
}
