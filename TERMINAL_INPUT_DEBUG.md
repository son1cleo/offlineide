# Terminal Input Debug Guide

## How to Diagnose the Terminal Input Issue

The terminal component now includes debug logging. To test:

### Step 1: Open Browser DevTools
- Press `F12` (or `Ctrl+Shift+I` on Windows/Linux, `Cmd+Option+I` on Mac)
- Go to the **Console** tab

### Step 2: Create a Test File with Python Input
1. Click "New File" 
2. Name it `test_input.py`
3. Paste this code:
```python
name = input("What is your name? ")
print(f"Hello, {name}!")

number = input("Enter a number: ")
print(f"You entered: {number}")
```

### Step 3: Run the Code
1. Select `test_input.py` from file list
2. Click "Run Code"
3. Watch the console for debug logs

### Step 4: Review Console Logs (Look for these patterns)

**Expected Flow:**
```
[Terminal] State: { isRunning: true, waitingForInput: false, hasCallback: true }
[Terminal] Attempting focus on input element
[Terminal] Focus result: { focused: true, disabled: false }
[Terminal] Form submit attempt: { inputValue: "your input", isRunning: true, hasCallback: true, willSubmit: true }
[Terminal] Sending input: your input
[App] handleTerminalInput called: { input: "your input", hasWriter: true }
[App] Writing to stdin: your input
[Runtime] Writing to stdin: { input: "your input", hasWriter: true }
[Runtime] stdin write successful
```

### Step 5: Try Submitting Input to Terminal

1. Type a response in the terminal input field
2. Press **Enter**
3. Check console logs - which logs appear?

### Common Issues to Check

**Issue: Input field not getting focus**
- Look for: `[Terminal] Focus result: { focused: false, disabled: false }`
- **Cause**: Focus management not working on this device
- **Solution**: May need to handle touch events differently

**Issue: Form submission not triggering**
- Look for: No `[Terminal] Form submit attempt` log
- **Cause**: Mobile keyboard or form event issues
- **Solution**: May need to add onChangehandleChange for mobile

**Issue: "Cannot submit - condition failed"**
- Look for: `[Terminal] Cannot submit - condition failed`
- **Cause**: Either `onInput` callback is undefined or `isRunning` is false
- **Solution**: Process might have exited before input was ready

**Issue: writeInput not called**
- Look for: No `[App] handleTerminalInput called` log
- **Cause**: Terminal input handler not firing
- **Solution**: Form submission event not propagating

**Issue: No stdinWriter available**
- Look for: `[Runtime] No stdinWriter available`
- **Cause**: Process stdin was not properly initialized
- **Solution**: WebContainer API issue or process killed prematurely

## Test Cases to Try

### Test 1: Simple Input Echo
**File:** `test_input.py`
```python
name = input("Enter something: ")
print(name)
```
**Expected:** Your input appears on next line

### Test 2: Multiple Prompts
**File:** `test_multi.py`
```python
a = input("First: ")
b = input("Second: ")
c = input("Third: ")
print(f"You said: {a}, {b}, {c}")
```
**Expected:** Can answer all three prompts

### Test 3: Node.js Input
**File:** `test_input.js`
```javascript
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What is your name? ', (answer) => {
  console.log(`Hello, ${answer}!`);
  rl.close();
});
```
**Expected:** Can answer the prompt

## When You've Found an Issue

1. **Note the exact console logs you see** (copy-paste them)
2. **Note the device/browser** (e.g., "Safari on iPhone 12", "Chrome on Samsung Galaxy")
3. **Note the exact behavior** (e.g., "Input field appears but Enter doesn't submit")
4. **Share this information** so we can fix it

## Troubleshooting Tips

- **Can't see console?** Try opening DevTools before running code
- **On mobile?** Use remote DevTools: https://debug.firefox.com or Chrome Remote Debugging
- **Console cleared?** Run code again - it will repeat the logs
- **On Vercel?** Test on localhost first at http://localhost:3001
