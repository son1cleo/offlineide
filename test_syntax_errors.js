// JavaScript Syntax Error Examples
// Try editing these to see real-time error detection!

// ❌ ERROR: Missing closing parenthesis
function greet(name {
  console.log("Hello, " + name);
}

// ❌ ERROR: Missing semicolon (will be warned in strict mode)
let x = 5
let y = 10

// ❌ ERROR: Undefined variable
console.log(undefinedVar);

// ❌ ERROR: Invalid syntax
const result = 5 +;

// ✅ CORRECT: This should work fine
function add(a, b) {
  return a + b;
}

console.log(add(2, 3));
