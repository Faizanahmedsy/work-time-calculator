#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Template for React functional component
const componentTemplate = (name) => `import React from 'react';

function ${name}() {
  return (
    <div>
      <h1>${name} Component</h1>
    </div>
  );
}

export default ${name};
`;

// Template for React page component with Next.js
const pageTemplate = (name) => `export default function ${name}() {
  return (
    <div>
      <h1>${name} Page</h1>
    </div>
  );
}
`;

async function promptUser() {
  const questions = [
    {
      question: 'What would you like to create? (component/page)',
      key: 'type'
    },
    {
      question: 'Enter name:',
      key: 'name' 
    },
    {
      question: 'Enter directory path (relative to project root):',
      key: 'path'
    }
  ];

  const answers = {};

  for (const {question, key} of questions) {
    answers[key] = await new Promise(resolve => {
      rl.question(question + ' ', resolve);
    });
  }

  return answers;
}

async function main() {
  try {
    const answers = await promptUser();
    
    const fullPath = path.join(process.cwd(), answers.path);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    const template = answers.type === 'component' 
      ? componentTemplate(answers.name)
      : pageTemplate(answers.name);

    const fileName = `${answers.name}${answers.type === 'component' ? '.jsx' : '/page.jsx'}`;
    const filePath = path.join(fullPath, fileName);

    fs.writeFileSync(filePath, template);

    console.log(`Successfully created ${answers.type}: ${filePath}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

main();

// How to use this CLI tool:
// 1. Make sure you have Node.js installed on your system.
// 2. Save this file as 'react-cli.js' in your project's 'cli' directory.
// 3. Make the file executable by running: chmod +x cli/react-cli.js
// 4. Run the CLI tool from your project root using: ./cli/react-cli.js
// 5. Follow the prompts to create a new React component or page:
//    - Choose between creating a 'component' or a 'page'
//    - Enter the name for your new component or page
//    - Specify the directory path where you want to create the file (relative to project root)
// 6. The tool will create the specified component or page with a basic template.

module.exports = main;
