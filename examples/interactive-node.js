// Interactive Node.js Example
// Tests stdin input with readline interface

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Node.js Interactive Terminal Demo\n');

// Question 1
rl.question('What is your favorite programming language? ', (language) => {
  console.log(`Great choice! ${language} is awesome.\n`);
  
  // Question 2
  rl.question('On a scale of 1-10, how much do you love coding? ', (rating) => {
    console.log(`You rated ${rating}/10! Keep coding! 💻\n`);
    
    // Question 3
    rl.question('What are you building today? ', (project) => {
      console.log(`\n✨ "${project}" sounds amazing!`);
      console.log('Good luck with your project!\n');
      rl.close();
    });
  });
});

rl.on('close', () => {
  console.log('👋 Interactive session ended.');
  process.exit(0);
});
