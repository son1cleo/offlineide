// Test: Verify final output is captured in Node.js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Starting test...');

rl.question('Enter first number: ', (num1) => {
  rl.question('Enter second number: ', (num2) => {
    const result = parseFloat(num1) + parseFloat(num2);
    console.log(`Result: ${num1} + ${num2} = ${result}`);
    console.log('Test complete - you should see this line!');
    rl.close();
  });
});
