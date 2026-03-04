/**
 * Code templates for different languages
 * Provides starter code for each supported language
 */

export const CODE_TEMPLATES = {
  javascript: `// Welcome to SouthStack IDE - JavaScript
// An offline-first AI-powered development environment

function hello() {
  console.log("Hello from SouthStack!");
  return "Hello World!";
}

const result = hello();
console.log(result);
`,

  typescript: `// Welcome to SouthStack IDE - TypeScript
// This will be transpiled and executed by ts-node

interface Greeting {
  name: string;
  message: string;
}

function createGreeting(name: string): Greeting {
  return {
    name,
    message: \`Hello, \${name}!\`,
  };
}

const greeting = createGreeting("SouthStack");
console.log(greeting.message);
`,

  python: `# Welcome to SouthStack IDE - Python
# Your code will be executed in the Node.js environment

def hello():
    print("Hello from SouthStack!")
    return "Hello World!"

if __name__ == "__main__":
    result = hello()
    print(result)
`,

  go: `// Welcome to SouthStack IDE - Go
// Compiled and executed dynamically

package main

import "fmt"

func hello() string {
	return "Hello from SouthStack!"
}

func main() {
	msg := hello()
	fmt.Println(msg)
	fmt.Println("Go is awesome!")
}
`,

  bash: `#!/bin/bash
# Welcome to SouthStack IDE - Bash
# Your shell script will be executed

echo "Hello from SouthStack!"
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la
`,

  json: `{
  "title": "SouthStack IDE",
  "description": "An offline-first AI-powered IDE",
  "version": "2.0.0",
  "features": [
    "Multiple language support",
    "Local AI assistance",
    "Offline-first",
    "No API keys required"
  ]
}
`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SouthStack IDE</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      margin: 0;
    }
    h1 {
      text-align: center;
      font-size: 2.5rem;
    }
  </style>
</head>
<body>
  <h1>Welcome to SouthStack IDE</h1>
  <p>Multiple language support coming soon!</p>
</body>
</html>
`,
};

/**
 * Get code template for a language
 */
export function getCodeTemplate(languageId) {
  return CODE_TEMPLATES[languageId] || CODE_TEMPLATES.javascript;
}
