# Terminal Input Fix - Testing Guide

## Changes Made

### Problem Identified
Python's `input()` (and similar interactive functions) **don't send their prompts to stdout**. They write directly to the terminal, so our output detection couldn't see them. This meant:
- Input field was not getting focused properly
- "Waiting for input" state wasn't being detected
- Input appeared disabled or unresponsive on mobile

### Fixes Applied

1. **Removed `disabled` attribute** - Mobile browsers often can't focus disabled inputs. Now input is only rendered when `isRunning` is true.

2. **Always enable input when stdin is available** - Instead of guessing from output patterns, we now detect if stdin writer was successfully created and assume any program with stdin available might need input.

3. **Enhanced focus management** - Added logging and ensured focus happens reliably with better event handling.

4. **Improved keyboard handling** - Enter key now handled both via form submission AND via onKeyDown for better mobile support.

5. **Better input styling** - Added focus outline and removed potential visual issues.

## Testing Steps

### Test 1: Python Simple Input
1. Open SouthStack at http://localhost:3002
2. Open **Browser DevTools** (F12)
3. Go to **Console** tab
4. Create new file: `test_simple.py`
5. Paste:
```python
name = input("What is your name? ")
print(f"Hello, {name}!")
```
6. Select file and click **Run Code**
7. Watch for console logs showing stdin writer creation
8. Type a name in the terminal input field
9. Press **Enter**

**Expected Console Output:**
```
[Runtime] stdin writer obtained successfully
[Terminal] Attempting focus on input element
[Terminal] Focus result: { focused: true, disabled: false }
[Terminal] Enter key pressed
[Terminal] Sending input: [your-name]
[Runtime] Writing to stdin: { input: "[your-name]", hasWriter: true }
[Runtime] stdin write successful
```

**Expected Terminal Output:**
```
⚡ Executing test_simple.py (python)...
What is your name? › John
Hello, John!
✅ Code executed successfully
```

### Test 2: Multiple Prompts
1. Create file: `test_multi.py`
2. Paste:
```python
print("Quiz Time!")
ans1 = input("What is 2 + 2? ")
ans2 = input("What is your name? ")
ans3 = input("Do you like Python? (yes/no): ")
print(f"Answers: {ans1}, {ans2}, {ans3}")
```
3. Run and answer all three prompts

**Expected:** Can answer all three without any issues

### Test 3: Node.js Interactive (if JavaScript)
1. Create file: `test_input.js`
2. Paste:
```javascript
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Your name: ', (answer) => {
  console.log(`Hello, ${answer}!`);
  rl.close();
});
```
3. Run and test input

### Test 4: Mobile Responsiveness
Test on actual mobile device (or use Chrome DevTools mobile emulation):
1. Open DevTools
2. Click device toolbar (mobile emulator icon)
3. Select iPhone 12 or similar
4. Run `test_simple.py`
5. Check if:
   - Input field is visible
   - Keyboard pops up
   - Can type
   - Can submit with Enter

## Debug Checklist

If input not working:

- [ ] **Console shows stdin writer created?**
  - If NO: Process stdin initialization failed
  - If YES: Continue

- [ ] **Console shows focus attempt?**
  - If NO: Component didn't mount properly
  - If YES: Continue

- [ ] **Console shows "focused: true"?**
  - If NO: Focus failed on this device (may need different approach)
  - If YES: Continue

- [ ] **Input value changes as you type?**
  - If NO: onChange event not firing (rare)
  - If YES: Continue

- [ ] **Enter key press shows in console?**
  - If NO: onKeyDown not firing (form handling issue)
  - If YES: Input being sent but process not responding

- [ ] **"stdin write successful" in console?**
  - If NO: stdin writer failed (process issue)
  - If YES: Input was sent correctly, check if program is expecting it

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Input field not visible** | Just terminal output, no input field | Make sure running valid Python/Node file with `input()` or `readline` |
| **Input field visible but not focusable** | Can't click to type | Device/browser issue - check console logs for focus errors |
| **Can type but Enter doesn't work** | Text appears but no submission | Check "Enter key pressed" in console - may be keyboard event not firing |
| **No response after submitting** | Input sent but program hangs | Program might be waiting for specific format |
| **Mobile keyboard won't pop up** | iOS/Android keyboard not appearing | Try removing any CSS that might hide input, test focus timing |
| **Input works once then fails** | First run okay, second run broken | Process might not be fully killed/cleaned up - refresh page |

## Verifying the Fix

**On Localhost:**
```bash
npm run dev  # Should already be running on port 3002
# Open http://localhost:3002
# Follow Test 1 above
```

**On Mobile:**
- Use Chrome DevTools remote debugging
- Or enter `device.local.ip:3002` on your phone (after setting up network)

**On Vercel:**
- Needs full redeploy after git push
- Will have same functionality as localhost

## File Changes

Modified files:
- `src/components/Terminal.jsx` - Removed disabled attribute, enhanced focus and key handling
- `src/components/Terminal.css` - Added focus styling
- `src/utils/runtime.js` - Added hasStdin flag, enhanced logging
- `src/App.jsx` - Check hasStdin to set waitingForInput, added logging

## Next Steps if Still Not Working

1. **Check browser compatibility** - Test on Chrome, Firefox, Safari
2. **Test on real device** - Emulator vs physical phone can behave differently
3. **Check WebContainer status** - Ensure WebContainer fully initialized before running
4. **Verify stdin stream** - Check if process.stdin properly exists on WebContainer processes
5. **Try alternative input methods** - If keyboard entry fails, might need to redesign UX

## Rollback if Issues

If these changes break something:
```bash
git log --oneline  # Find the commit hash
git revert <commit-hash>
```

Key commit info:
- Timestamp: When you made these changes
- Files changed: Terminal.jsx, Terminal.css, runtime.js, App.jsx
