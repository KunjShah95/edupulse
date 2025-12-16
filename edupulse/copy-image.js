const fs = require('fs');
const path = require('path');

const sourceFile = 'C:\\Users\\jksha\\.gemini\\antigravity\\brain\\048a9ee3-5db6-4df2-8169-37437918ba0a\\uploaded_image_1765872566392.jpg';
const destFile = path.join(__dirname, 'public', 'hero-image.jpg');

try {
    fs.copyFileSync(sourceFile, destFile);
    console.log('Image copied successfully to:', destFile);
} catch (err) {
    console.error('Error copying file:', err);
    process.exit(1);
}
