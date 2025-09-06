# Gemini Development Workflow

This document outlines the development workflow for this project when using Gemini.

## Starting the application

To start the application, run the following command:

\`\`\`bash
npm run dev:safe
\`\`\`

This command will first run the smoke tests to ensure that the core functionality of the application is working as expected. If the tests pass, the application will start in development mode.

## Running tests

To run the full suite of tests, use the following command:

\`\`\`bash
npm run test
\`\`\`
To run only the smoke tests, use the following command:
\`\`\`bash
npm run test:quick
\`\`\`
