const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const { LRUCache } = require('lru-cache');

const cache = new LRUCache({
    max: 500,
    maxSize: 1024 * 1024 * 512,
    sizeCalculation: (value, key) => {
        return JSON.stringify(value).length;
    },
    updateAgeOnGet: true
});

const dirty = new Map();
let syncInterval;
let isSyncing = false;

class JsonChunkProcessor extends Transform {
    constructor(options = {}) {
        super({ ...options, objectMode: true });
        this.buffer = '';
    }
    
    _transform(chunk, encoding, callback) {
        try {
            const data = JSON.parse(chunk.toString());
            this.push(data);
            callback();
            return;
        } catch (e) {
            this.buffer += chunk.toString();
            try {
                const data = JSON.parse(this.buffer);
                this.push(data);
                this.buffer = '';
                callback();
                return;
            } catch (e) {
                callback();
            }
        }
    }

    _flush(callback) {
        if (this.buffer) {
            try {
                const data = JSON.parse(this.buffer);
                this.push(data);
            } catch (e) {
                //console.error('Error parsing remaining buffer:', e);
            }
        }
        callback();
    }
}

async function getFilePath(table) {
    return path.join(__dirname, '../../storage/database', `${table}.json`);
}

async function streamWrite(filepath, data) {
    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filepath, { flags: 'w' });
        stream.write(JSON.stringify(data, null, 2));
        stream.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

async function streamRead(filepath, key) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filepath)) {
            resolve(null);
            return;
        }

        const stream = fs.createReadStream(filepath, { encoding: 'utf8' });
        const processor = new JsonChunkProcessor();
        let found = null;

        processor.on('data', (data) => {
            if (data[key] !== undefined) {
                found = data[key];
                stream.destroy();
                resolve(found);
            }
        });

        stream.on('error', (err) => {
            console.error('Stream error:', err);
            if (!found) resolve(null);
        });

        processor.on('error', (err) => {
            console.error('Processor error:', err);
            if (!found) resolve(null);
        });

        stream.on('end', () => {
            if (!found) resolve(null);
        });

        stream.pipe(processor);
    });
}

async function syncToFiles() {
    if (isSyncing) return;
    isSyncing = true;

    try {
        const promises = [];
        for (const [table, tableData] of dirty) {
            const filepath = await getFilePath(table);
            promises.push(streamWrite(filepath, tableData));
        }
        await Promise.all(promises);
        dirty.clear();
    } finally {
        isSyncing = false;
    }
}

function startSync() {
    if (!syncInterval) {
        syncInterval = setInterval(syncToFiles, 10000);
    }
}

async function set(table, key, value) {
    const cacheKey = `${table}:${key}`;
    cache.set(cacheKey, value);
    
    let tableData = dirty.get(table) || {};
    tableData[key] = value;
    dirty.set(table, tableData);
    return true;
}

async function get(table, key) {
    const cacheKey = `${table}:${key}`;
    const cachedValue = cache.get(cacheKey);
    if (cachedValue !== undefined) {
        return cachedValue;
    }
    const tableData = dirty.get(table);
    if (tableData && key in tableData) {
        cache.set(cacheKey, tableData[key]);
        return tableData[key];
    }
    try {
        const filepath = await getFilePath(table);
        const value = await streamRead(filepath, key);
        if (value !== null) {
            cache.set(cacheKey, value);
        }
        return value;
    } catch {
        return null;
    }
}

async function remove(table, key) {
    const cacheKey = `${table}:${key}`;
    cache.delete(cacheKey);
    
    const tableData = dirty.get(table);
    if (tableData && key in tableData) {
        delete tableData[key];
        dirty.set(table, tableData);
        return true;
    }
    return false;
}

async function reset(table) {
    try {
        const filepath = await getFilePath(table);
        await fs.promises.unlink(filepath).catch(() => {});
        dirty.delete(table);
        
        for (const key of cache.keys()) {
            if (key.startsWith(`${table}:`)) {
                cache.delete(key);
            }
        }
        return true;
    } catch {
        return false;
    }
}

async function load() {
    try {
        const dbPath = path.join(__dirname, '../../storage/database');
        const files = await fs.promises.readdir(dbPath);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            const table = file.slice(0, -5);
            const filepath = path.join(dbPath, file);
            
            const stream = fs.createReadStream(filepath, { encoding: 'utf8' });
            const processor = new JsonChunkProcessor();
            
            stream.pipe(processor);
            processor.on('data', (data) => {
                dirty.set(table, data);
                Object.entries(data).slice(0, 100).forEach(([key, value]) => {
                    cache.set(`${table}:${key}`, value);
                });
            });
        }
        
        startSync();
        return true;
    } catch (e) {
        console.error('Load error:', e);
        return false;
    }
}

process.on('SIGINT', () => {
    clearInterval(syncInterval);
    console.log("SIGINT received");
    syncToFiles().finally(() => process.exit());
});

process.on('SIGTERM', () => {
    clearInterval(syncInterval);
    console.log("SIGTERM received");
    syncToFiles().finally(() => process.exit());
});

function info() {
    return {
        display: "X0 [JS]",
        name: "holadb",
        adapter: "holaclient",
        series: "X",
        type: "database",
        version: 2,
        author: "CR072",
        async: false,
        functions: ["get", "set", "delete", "reset", "load"]
    };
}

module.exports = { get, set, delete: remove, reset, load, info };