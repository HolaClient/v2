const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve('./build/Release');
const targetDir = path.resolve('./');

fs.mkdirSync(targetDir, { recursive: true });

const FFFFFF = path.join(sourceDir, 'hcw.node');
if (fs.existsSync(FFFFFF)) {
    fs.copyFileSync(FFFFFF, path.join(targetDir, 'hcw.node'));
    console.log('Copied addon to:', path.join(targetDir, 'hcw.node'));
} else {
    console.error('Could not find addon at:', FFFFFF);
    process.exit(1);
}