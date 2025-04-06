const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

function runCommand(a, b = {}) {
    try {
        execSync(a, { stdio: 'inherit', ...b });
    } catch (c) {
        console.error(`Failed to execute: ${a}`);
        process.exit();
    }
}

const projectRoot = path.resolve(__dirname);
const buildDir = path.join(projectRoot, 'build');
const srcDir = path.join(projectRoot, 'src');
const bindingsDir = path.join(projectRoot, 'bindings', 'node');
const headersDir = path.join(projectRoot, 'headers', 'nodejs');
const nodeVersion = process.version;
const headersCacheDir = path.join(headersDir, nodeVersion.substring(1));

if (!fs.existsSync(headersDir)) {
    fs.mkdirSync(headersDir, { recursive: true });
}

async function checkHeaders() {
    try {
        if (fs.existsSync(headersCacheDir)) {
            console.log('Using cached Node.js headers...');
            return headersCacheDir;
        }

        console.log('Downloading Node.js headers...');
        const a = `https://nodejs.org/download/release/${nodeVersion}/node-${nodeVersion}-headers.tar.gz`;
        const b = path.join(buildDir, 'tmp');
        fs.mkdirSync(b, { recursive: true });
        const c = path.join(b, 'headers.tar.gz');
        
        await new Promise((d, e) => {
            const f = fs.createWriteStream(c);
            https.get(a, (g) => {
                if (g.statusCode !== 200) {
                    e(new Error(`Failed to download headers: ${g.statusCode}`));
                    return;
                }
                g.pipe(f);
                f.on('finish', () => {
                    f.close(d);
                });
            }).on('error', e);
        });

        fs.mkdirSync(headersCacheDir, { recursive: true });
        
        const d = process.platform === 'win32' 
            ? `tar -xf "${c}" -C "${headersCacheDir}" --strip-components=1`
            : `tar xzf "${c}" -C "${headersCacheDir}" --strip-components=1`;
            
        runCommand(d);
        fs.rmSync(b, { recursive: true, force: true });
        return headersCacheDir;
    } catch (a) {
        if (fs.existsSync(b)) {
            fs.rmSync(b, { recursive: true, force: true });
        }
        throw new Error(`Failed to setup Node.js headers: ${a.message}`);
    }
}

async function build() {
    try {
        console.log('Starting build process...');
        const a = await checkHeaders();
        fs.mkdirSync(buildDir, { recursive: true });
        console.log('Compiling Assembly files...');
        const b = fs.readdirSync(path.join(srcDir, 'http'))
            .filter(x => x.endsWith('.asm'));

        for (const c of b) {
            const d = path.join(srcDir, 'http', c);
            const e = path.join(buildDir, `${path.parse(c).name}.o`);
            const f = process.platform === 'win32' ? 'win64' : 'elf64';
            const g = process.platform === 'win32' ? '' : ' -DPIC';
            runCommand(`nasm -f ${f}${g} -o "${e}" "${d}"`);
        }

        console.log('Running build script...');
        process.chdir(bindingsDir);
        process.env.NODE_HEADERS_DIR = a;
        runCommand('node scripts/build.js');

        console.log('Copying files...');
        const h = path.join(bindingsDir, 'build');
        const i = `hcw_${process.platform}_${process.arch}.node`;
        const j = path.join(h, i);

        if (!fs.existsSync(j)) {
            console.error(`Expected build output not found: ${j}`);
            process.exit(1);
        }

        const k = path.normalize(projectRoot);
        fs.mkdirSync(k, { recursive: true });
        const l = path.join(k, i);
        console.log(`Copying ${j} to ${l}`);
        await fs.promises.copyFile(j, l);
        console.log('Successfully copied build artifact');

        process.chdir(projectRoot);
        console.log('Build complete!');
    } catch (a) {
        throw new Error(`Build process failed: ${a.message}`);
    }
}

build().catch(a => {
    console.error('Build failed:', a);
    process.exit(1);
});
