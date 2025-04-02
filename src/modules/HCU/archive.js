const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const util = require('util');

const deflateRawAsync = util.promisify(zlib.deflateRaw);
const inflateRawAsync = util.promisify(zlib.inflateRaw);

async function zipDirectory(a, b) {
    const c = [];
    await collectEntries(a, '', c);
    await processEntries(c, b);
}

async function zipFiles(a, b) {
    const c = [];
    for (const d of a) {
        const e = path.resolve(d);
        const f = path.basename(e);
        c.push({ fullPath: e, relativePath: f, isDirectory: false });
    }
    await processEntries(c, b);
}

async function processEntries(a, b) {
    let c = 0;
    const d = [];
    const e = [];
    for (const f of a) {
        const g = f.isDirectory ? Buffer.alloc(0) : await fs.promises.readFile(f.fullPath);
        const h = f.isDirectory ? Buffer.alloc(0) : await deflateRawAsync(g);
        const i = f.isDirectory ? 0 : calculateCRC32(g);
        const j = createLocalFileHeader(f.relativePath, i, h.length, g.length, f.isDirectory);
        const k = j.length;
        d.push(j, h);
        const l = createCentralDirectoryRecord(f.relativePath, i, h.length, g.length, c, f.isDirectory);
        e.push(l);
        c += k + h.length;
    }
    const m = Buffer.concat(e);
    const n = m.length;
    const o = c;
    const p = createEndOfCentralDirectoryRecord(e.length, n, o);
    const q = Buffer.concat([...d, m, p]);
    await fs.promises.writeFile(b, q);
}

async function collectEntries(a, b, c) {
    const d = await fs.promises.readdir(a, { withFileTypes: true });
    for (const e of d) {
        const f = path.join(a, e.name);
        const g = path.posix.join(b, e.name);
        if (e.isDirectory()) {
            c.push({ fullPath: f, relativePath: g + '/', isDirectory: true });
            await collectEntries(f, g, c);
        } else {
            c.push({ fullPath: f, relativePath: g, isDirectory: false });
        }
    }
}

async function unzipFile(a, b) {
    const c = await fs.promises.readFile(a);
    const d = parseCentralDirectory(c);
    for (const e of d) {
        const f = path.join(b, e.fileName);
        if (e.isDirectory) {
            await fs.promises.mkdir(f, { recursive: true });
        } else {
            await fs.promises.mkdir(path.dirname(f), { recursive: true });
            const g = c.slice(e.offset, e.offset + e.compressedSize);
            const h = await inflateRawAsync(g);
            if (calculateCRC32(h) !== e.crc32) {
                return `CRC32 mismatch for file ${e.fileName}`;
            }
            await fs.promises.writeFile(f, h);
        }
    }
}

function calculateCRC32(a) {
    let b = 0 ^ -1;
    for (const c of a) {
        b = (b >>> 8) ^ crcTable[(b ^ c) & 0xFF];
    }
    return (b ^ -1) >>> 0;
}

const crcTable = (() => {
    const a = [];
    for (let b = 0; b < 256; b++) {
        let c = b;
        for (let d = 0; d < 8; d++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        a[b] = c >>> 0;
    }
    return a;
})();

function createLocalFileHeader(a, b, c, d, e) {
    const f = Buffer.alloc(30);
    f.writeUInt32LE(0x04034b50, 0);
    f.writeUInt16LE(20, 4);
    f.writeUInt16LE(0, 6);
    f.writeUInt16LE(e ? 0 : 8, 8);
    f.writeUInt16LE(0, 10);
    f.writeUInt16LE(0, 12);
    f.writeUInt32LE(b, 14);
    f.writeUInt32LE(c, 18);
    f.writeUInt32LE(d, 22);
    const g = Buffer.from(a, 'utf-8');
    f.writeUInt16LE(g.length, 26);
    f.writeUInt16LE(0, 28);
    return Buffer.concat([f, g]);
}

function createCentralDirectoryRecord(a, b, c, d, e, f) {
    const g = Buffer.alloc(46);
    g.writeUInt32LE(0x02014b50, 0);
    g.writeUInt16LE(20, 4);
    g.writeUInt16LE(20, 6);
    g.writeUInt16LE(0, 8);
    g.writeUInt16LE(f ? 0 : 8, 10);
    g.writeUInt16LE(0, 12);
    g.writeUInt16LE(0, 14);
    g.writeUInt32LE(b, 16);
    g.writeUInt32LE(c, 20);
    g.writeUInt32LE(d, 24);
    const h = Buffer.from(a, 'utf-8');
    g.writeUInt16LE(h.length, 28);
    g.writeUInt16LE(0, 30);
    g.writeUInt16LE(0, 32);
    g.writeUInt16LE(0, 34);
    g.writeUInt16LE(0, 36);
    g.writeUInt32LE(f ? 0x10 : 0x20, 38);
    g.writeUInt32LE(e, 42);
    return Buffer.concat([g, h]);
}

function createEndOfCentralDirectoryRecord(a, b, c) {
    const d = Buffer.alloc(22);
    d.writeUInt32LE(0x06054b50, 0);
    d.writeUInt16LE(0, 4);
    d.writeUInt16LE(0, 6);
    d.writeUInt16LE(a, 8);
    d.writeUInt16LE(a, 10);
    d.writeUInt32LE(b, 12);
    d.writeUInt32LE(c, 16);
    d.writeUInt16LE(0, 20);
    return d;
}

function parseCentralDirectory(a) {
    const b = [];
    const c = 0x06054b50;
    let d = a.length - 22;
    const e = Math.max(0, a.length - 0xFFFF - 22);
    while (d >= e) {
        if (a.readUInt32LE(d) === c) {
            break;
        }
        d--;
    }
    if (d < e) {
        return 'End of Central Directory not found';
    }
    const f = a.readUInt16LE(d + 10);
    const g = a.readUInt32LE(d + 12);
    const h = a.readUInt32LE(d + 16);
    let i = h;
    for (let j = 0; j < f; j++) {
        const k = a.readUInt32LE(i);
        if (k !== 0x02014b50) {
            return 'Invalid central directory file header signature';
        }
        const l = a.readUInt32LE(i + 16);
        const m = a.readUInt32LE(i + 20);
        const n = a.readUInt32LE(i + 24);
        const o = a.readUInt16LE(i + 28);
        const p = a.readUInt16LE(i + 30);
        const q = a.readUInt16LE(i + 32);
        const r = a.readUInt32LE(i + 42);
        const s = a.toString('utf-8', i + 46, i + 46 + o);
        const t = s.endsWith('/');
        b.push({
            fileName: s,
            compressedSize: m,
            uncompressedSize: n,
            offset: r + 30 + o,
            crc32: l,
            isDirectory: t
        });
        i += 46 + o + p + q;
    }
    return b;
}

module.exports = {
    zipDirectory,
    unzipFile,
    zipFiles
};
