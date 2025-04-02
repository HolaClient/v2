const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');

const exclude = ['node_modules', '.vscode', 'storage/installed.txt', 'package-lock.json', 'yarn.lock', 'production', 'todo.txt', '.env', 'storage/database/*', 'storage/cache/*', 'storage/backups/*', 'storage/logs/dashboard/*', 'storage/logs/api/*'];
const a = exclude.map(e => path.resolve(__dirname, '../../', e));

async function mkdir() {
    const b = path.resolve(__dirname, '../../production');
    await fs.remove(b);
    await fs.mkdir(b, { recursive: true });
    return b;
}

async function copyFile(a, b) {
    await fs.mkdir(path.dirname(b), { recursive: true });
    await fs.copyFile(a, b);
}

async function copy(a) {
    const b = path.join(a, '.directory');
    await fs.writeFile(b, '');
}

function status(c) {
    if (a.includes(c) || a.filter(e => e.endsWith('*')).map(e => e.slice(0, -1)).some(f => c.startsWith(f))) return true;
    return false;
}

async function cpr(a, b) {
    const c = await fs.readdir(a, { withFileTypes: true });
    await Promise.all(c.map(async entry => {
        const d = path.join(a, entry.name);
        const e = path.join(b, entry.name);
        if (status(d)) return;
        if (entry.isDirectory()) {
            await fs.mkdir(e, { recursive: true });
            await cpr(d, e);
            await copy(e);
        } else {
            await copyFile(d, e);
        }
    }));
}

async function main() {
    const f = Date.now();
    const g = await mkdir();
    const h = path.resolve(__dirname, '../../');
    await cpr(h, g);
    const j = path.join(h, 'app/database/seeders/.env');
    const k = path.join(g, '.env-example');
    if (await fs.pathExists(j)) await copyFile(j, k);
    const l = Date.now();
    const m = l - f;
    console.log(`Successfully built application in ${m}ms.`);
    const n = `HolaClient-v2.build_${(new Date()).getDate()}-${(new Date()).getMonth() + 1}.zip`;
    const o = path.resolve(__dirname, '../../', n);
    const p = new AdmZip();
    p.addLocalFolder(g);
    p.writeZip(o);
    await fs.remove(g);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});