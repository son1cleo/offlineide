# Interactive Terminal Examples

This directory contains example files demonstrating the fully interactive terminal capabilities of SouthStack IDE.

## Features Tested

✅ **Real-time stdin/stdout** - User input is forwarded to running processes in real-time  
✅ **No freezing** - Terminal remains responsive while waiting for input  
✅ **Multi-language support** - Interactive programs work in Python, Node.js, Bash, and more  
✅ **Input echoing** - User input is displayed in the terminal  
✅ **Stream handling** - Both stdout and stderr are properly captured and displayed

## Example Files

### 🐍 Python Examples
- **`simple-input.py`** - Basic input/output test
- **`interactive-python.py`** - Multiple inputs with calculations and error handling

### 📦 Node.js Examples
- **`interactive-node.js`** - Readline interface with sequential questions

### 🐚 Bash Examples
- **`interactive-bash.sh`** - Shell script with read commands and menu selection

## How to Test

1. **Open any example file** in the SouthStack IDE editor
2. **Click "Run Code"** to start execution
3. **Watch the terminal** - you'll see prompts asking for input
4. **Type your response** in the input field at the bottom of the terminal
5. **Press Enter** to submit your input
6. **The program continues** processing your input in real-time

## Interactive Features

### Input Field
- Appears at the bottom of the terminal when code is running
- Type your response and press Enter to send
- Press `Ctrl+C` to send interrupt signal (if supported)

### Visual Indicators
- **"Running..."** status when code is executing
- **"Waiting for input..."** status when program expects user input
- **Input echo** - Your submitted input is shown with a `›` prompt

### Process Control
- **Stop button** - Click to terminate the running process at any time
- **Auto-cleanup** - Processes are properly cleaned up when stopped or completed

## Technical Implementation

The interactive terminal uses:
- **WebContainer stdin API** - Direct stdin stream access for user input
- **Persistent process connections** - stdin remains open during execution
- **Async stream readers** - Non-blocking output streaming
- **Smart input detection** - Heuristic detection of prompts waiting for input

## Supported Languages

| Language   | Interactive Support | Notes                          |
|------------|---------------------|--------------------------------|
| Python     | ✅ Full             | `input()` function works       |
| Node.js    | ✅ Full             | readline interface supported   |
| Bash       | ✅ Full             | `read` command supported       |
| JavaScript | ✅ Full             | Node.js runtime stdin access   |
| TypeScript | ✅ Full             | Compiled to JS, full support   |

## Tips

1. **Wait for prompts** - Look for text ending with `:` or `?` indicating input is expected
2. **Watch the status** - "Waiting for input..." indicator shows when to type
3. **Use Stop button** - If a program hangs, use the Stop button to terminate
4. **Test incrementally** - Start with `simple-input.py` before complex examples

## Next Steps

Try creating your own interactive programs:
- Build a CLI tool with menus
- Create a quiz application
- Implement a text-based game
- Develop an interactive configuration wizard

Happy coding! 🚀
