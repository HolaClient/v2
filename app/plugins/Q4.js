const fs = require('fs');
const path = require('path');

const STORE_SIZE = 1024;
const data = new Int32Array(STORE_SIZE * STORE_SIZE); 
const values = new Array(STORE_SIZE * STORE_SIZE); 
const dirty = new Map();

let syncInterval;
let isSyncing = false;

const MAX_FD = 32;
const fdPool = [];
let currentFd = 0;

function getFd() {
    if (fdPool.length < MAX_FD) {
        return Promise.resolve(null);
    }
    return new Promise(resolve => {
        const fd = fdPool[currentFd];
        currentFd = (currentFd + 1) % MAX_FD;
        resolve(fd);
    });
}

function releaseFd(fd) {
    if (fd !== null && !fdPool.includes(fd)) {
        fdPool.push(fd);
    }
}

async function safeFileOp(operation) {
    let fd = await getFd();
    try {
        return await new Promise((resolve, reject) => {
            operation(fd, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    } finally {
        if (fd !== null) {
            releaseFd(fd);
        }
    }
}

async function writeFileWithFD(filepath, data) {
    try {
        await safeFileOp((fd, cb) => {
            fs.writeFile(filepath, data, { encoding: 'utf8' }, cb);
        });
    } catch (e) {
        console.error('Write error:', e);
    }
}

async function readFileWithFD(filepath) {
    try {
        return await safeFileOp((fd, cb) => {
            fs.readFile(filepath, { encoding: 'utf8' }, cb);
        });
    } catch (e) {
        console.error('Read error:', e);
        return '{}';
    }
}

async function syncToFiles() {
    if (isSyncing) return;
    isSyncing = true;

    try {
        for (const [table, tableData] of dirty) {
            const filepath = path.join(__dirname, '../../storage/database', `${table}.json`);
            await writeFileWithFD(filepath, JSON.stringify(tableData, null, 2));
        }
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

function set(table, key, value) {
    let tableData = dirty.get(table) || {};
    tableData[key] = value;
    dirty.set(table, tableData);
    return true;
}

function get(table, key) {   
    const tableData = dirty.get(table);
    if (tableData && key in tableData) {
        return tableData[key];
    }
    
    return null;
}

function remove(table, key) {   
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
        const filepath = path.join(__dirname, '../../storage/database', `${table}.json`);
        await safeFileOp((fd, cb) => fs.unlink(filepath, cb)).catch(() => {});
        dirty.delete(table);
        return true;
    } catch {
        return false;
    }
}

async function load() {
    try {
        const dbPath = path.join(__dirname, '../../storage/database');
        const files = await safeFileOp((fd, cb) => fs.readdir(dbPath, cb));
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            try {
                const table = file.slice(0, -5); // remove .json
                const filepath = path.join(dbPath, file);
                const content = await readFileWithFD(filepath);
                const tableData = JSON.parse(content);
                dirty.set(table, tableData);
            } catch (e) {
                console.error(`Error loading ${file}:`, e);
            }
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
        display: "V2 [JS]",
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