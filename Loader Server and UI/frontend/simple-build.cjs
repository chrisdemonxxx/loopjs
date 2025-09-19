// Simple build test script
const fs = require('fs');
const path = require('path');

console.log('Creating simple build output...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Create a simple index.html
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LoopJS Frontend</title>
</head>
<body>
    <div id="root">
        <h1>LoopJS Frontend Build Test</h1>
        <p>This is a simple build output for testing purposes.</p>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);

console.log('Simple build completed successfully!');
console.log('Output created in:', distDir);