/**
 * Runtime setup and execution utilities
 * Handles installing dependencies and running code for various languages
 */

import { getExecutionCommand, getSetupCommands } from './languages';

/**
 * Ensure required packages are installed for a language
 * @param {string} languageId - The language ID
 * @param {Function} runCommand - The WebContainer runCommand function
 * @returns {Promise<boolean>} True if setup succeeded
 */
export async function ensureLanguageSetup(languageId, runCommand, onProgress) {
  const setupCommands = getSetupCommands(languageId);

  if (setupCommands.length === 0) {
    return true; // No setup required
  }

  try {
    for (const setupCmd of setupCommands) {
      if (onProgress) {
        onProgress(setupCmd.description);
      }

      const process = await runCommand(setupCmd.command, setupCmd.args);
      
      // Close stdin if available
      if (process.stdin) {
        try {
          process.stdin.close();
        } catch (e) {
          console.warn('Failed to close stdin:', e);
        }
      }

      const exitCode = await process.exit;

      if (exitCode !== 0) {
        console.error(`Setup failed for ${languageId}: ${setupCmd.description}`);
        return false;
      }

      // Consume output to avoid memory issues
      const reader = process.output.getReader();
      try {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } catch (e) {
        // Stream already closed
      }
    }

    return true;
  } catch (error) {
    console.error(`Error during language setup for ${languageId}:`, error);
    return false;
  }
}

/**
 * Execute code in a specific language (interactive mode)
 * @param {string} languageId - The language ID
 * @param {string} fileName - The file to execute
 * @param {string} content - The file content
 * @param {Object} webcontainerApi - The WebContainer API
 * @param {Function} onOutput - Callback for stdout output
 * @param {Function} onError - Callback for stderr output
 * @param {Function} onProgress - Callback for progress messages
 * @param {number} timeout - Timeout in milliseconds (default 30000)
 * @returns {Promise<Object>} Object with process, exitPromise, and writeInput function
 */
export async function executeCode(
  languageId,
  fileName,
  content,
  webcontainerApi,
  onOutput,
  onError,
  onProgress,
  timeout = 30000
) {
  let process = null;
  let timeoutId = null;
  let stdinWriter = null;

  try {
    // Setup language if needed
    if (onProgress) {
      onProgress(`Setting up ${languageId}...`);
    }

    const isSetup = await ensureLanguageSetup(languageId, webcontainerApi.runCommand, onProgress);

    if (!isSetup) {
      onError(`Failed to setup ${languageId}`);
      return { process: null, exitPromise: Promise.resolve(1), writeInput: () => {} };
    }

    // Write file
    await webcontainerApi.writeFile(fileName, content);

    // Get execution command
    const { command, args } = getExecutionCommand(languageId, fileName);

    if (onProgress) {
      onProgress(`Executing ${languageId}...`);
    }

    // Run the code
    process = await webcontainerApi.runCommand(command, args);
    
    // Keep stdin open for interactive input
    if (process && process.stdin) {
      stdinWriter = process.stdin.getWriter();
    }

    // Set timeout to kill process if it takes too long
    // For interactive programs (with stdin), use a much longer timeout (5 minutes)
    // since they're waiting for user input, not hung
    const effectiveTimeout = stdinWriter ? 300000 : timeout; // 5 min for interactive, default for non-interactive
    
    const killTimeout = () => {
      if (process) {
        try {
          process.kill();
          onError(`⏱️ Process timeout (${effectiveTimeout / 1000}s). Execution stopped.`);
        } catch (e) {
          console.warn('Failed to kill process on timeout:', e);
        }
      }
    };

    timeoutId = setTimeout(killTimeout, effectiveTimeout);

    // Function to write input to stdin
    const writeInput = async (input) => {
      if (stdinWriter) {
        try {
          const encoder = new TextEncoder();
          await stdinWriter.write(encoder.encode(input + '\n'));
        } catch (e) {
          console.warn('Failed to write to stdin:', e);
        }
      }
    };

    // Stream stdout in real-time - create promise to track completion
    let outputStreamComplete = Promise.resolve();
    
    if (process && process.output) {
      const reader = process.output.getReader();
      const decoder = new TextDecoder();
      
      // Read output asynchronously and track when it's done
      outputStreamComplete = (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            
            if (done) {
              // Flush any remaining bytes in the decoder buffer
              try {
                const finalText = decoder.decode(new Uint8Array(), { stream: false });
                if (finalText) {
                  onOutput(finalText);
                }
              } catch (e) {
                // Ignore flush errors
              }
              
              // Extra delay to ensure all buffered output is flushed
              await new Promise(resolve => setTimeout(resolve, 100));
              break;
            }
            
            if (value) {
              try {
                let text = '';
                
                // Handle different value types
                if (typeof value === 'string') {
                  text = value;
                } else if (value instanceof Uint8Array) {
                  text = decoder.decode(value, { stream: true });
                } else if (value instanceof ArrayBuffer) {
                  text = decoder.decode(new Uint8Array(value), { stream: true });
                } else if (Buffer && value instanceof Buffer) {
                  text = decoder.decode(new Uint8Array(value), { stream: true });
                } else {
                  // Fallback: try to convert to string
                  text = String(value);
                }
                
                if (text) {
                  onOutput(text);
                }
              } catch (e) {
                console.warn('Error decoding output chunk:', e);
                // Try to output raw value as string
                if (value) {
                  onOutput(String(value));
                }
              }
            }
          }
        } catch (e) {
          // Stream ended or error occurred
          console.warn('Output stream ended:', e);
        }
      })();
    }

    // Create an exit promise that cleans up resources
    const exitPromise = (async () => {
      try {
        // Wait for process exit
        const exitCode = await process.exit;
        
        // Critical: Wait for output stream to complete FIRST
        // This ensures all buffered output is read before we finish
        await outputStreamComplete;
        
        // Additional small delay for any final flush operations
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Clear timeout if process completed before timeout 
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Close stdin writer
        if (stdinWriter) {
          try {
            await stdinWriter.close();
          } catch (e) {
            console.warn('Failed to close stdin writer:', e);
          }
        }

        return exitCode || 0;
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        onError(`Error: ${error.message}`);
        return 1;
      }
    })();

    return {
      process,
      exitPromise,
      writeInput,
      kill: () => {
        if (process) {
          process.kill();
        }
      }
    };

  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    onError(`Error: ${error.message}`);
    return { 
      process: null, 
      exitPromise: Promise.resolve(1), 
      writeInput: () => {},
      kill: () => {}
    };
  }
}
