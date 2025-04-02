"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.status = void 0;
exports.get = get;
exports.set = set;
exports.delete = remove;
exports.reset = reset;
exports.init = init;
exports.info = info;
exports.flush = flush;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const STORE_SIZE = 1024;
const data = new Int32Array(STORE_SIZE * STORE_SIZE);
const values = new Array(STORE_SIZE * STORE_SIZE);
const dirty = new Map();
let syncInterval;
let isSyncing = false;
let isLoaded = false;
exports.status = isLoaded;
let dataChanged = false;
const MAX_FD = 32;
const fdPool = [];
let currentFd = 0;
let dbPath;
let dbType = 'tkv';
let useCompression = false;
async function getFd() {
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
        return await operation(fd);
    }
    finally {
        if (fd !== null) {
            releaseFd(fd);
        }
    }
}
async function ensureDirExists(dirPath) {
    try {
        await fs_1.promises.access(dirPath);
    }
    catch {
        await fs_1.promises.mkdir(dirPath, { recursive: true });
    }
}
async function writeFileWithFD(filepath, data) {
    try {
        await safeFileOp(async () => {
            const content = JSON.stringify(data, null, useCompression ? undefined : 2);
            await fs_1.promises.writeFile(filepath, content, { encoding: 'utf8' });
        });
    }
    catch (e) {
        console.error('Write error:', e);
    }
}
async function readFileWithFD(filepath) {
    try {
        const content = await safeFileOp(async () => {
            return await fs_1.promises.readFile(filepath, { encoding: 'utf8' });
        });
        return JSON.parse(content);
    }
    catch (e) {
        console.error(`Read error for ${filepath}:`, e);
        return {};
    }
}
async function syncToFiles() {
    if (isSyncing || !dataChanged)
        return false;
    isSyncing = true;
    try {
        for (const [table, tableData] of dirty) {
            if (dbType === 'kv' && table !== 'default')
                continue;
            const filepath = path_1.default.join(dbPath, `${table}.json`);
            await writeFileWithFD(filepath, tableData);
        }
    }
    finally {
        dataChanged = false;
        isSyncing = false;
    }
    return true;
}
function startSync() {
    if (!syncInterval) {
        syncInterval = setInterval(syncToFiles, 5000);
    }
}
function set(key, value, ignored) {
    if (dbType === 'kv') {
        const tableData = dirty.get('default') || {};
        tableData[key] = value;
        dirty.set('default', tableData);
    }
    else {
        let tableData = dirty.get(key) || {};
        tableData[value] = ignored;
        dirty.set(key, tableData);
    }
    dataChanged = true;
    return true;
}
function get(key, ignored) {
    if (dbType === 'kv') {
        const tableData = dirty.get('default');
        return tableData ? tableData[key] : null;
    }
    const tableData = dirty.get(key);
    return tableData ? tableData[ignored] : null;
}
function remove(key, ignored) {
    if (dbType === 'kv') {
        const tableData = dirty.get('default');
        if (tableData && key in tableData) {
            delete tableData[key];
            dirty.set('default', tableData);
            dataChanged = true;
            return true;
        }
    }
    else {
        const tableData = dirty.get(key);
        if (tableData && ignored in tableData) {
            delete tableData[ignored];
            dirty.set(key, tableData);
            dataChanged = true;
            return true;
        }
    }
    return false;
}
async function reset(table) {
    try {
        const filepath = path_1.default.join(dbPath, `${table}.json`);
        await safeFileOp(async () => {
            try {
                await fs_1.promises.unlink(filepath);
            }
            catch {
            }
        });
        dirty.delete(table);
        dataChanged = true;
        return true;
    }
    catch {
        return false;
    }
}
async function init(config) {
    try {
        dbPath = path_1.default.resolve(config.path);
        dbType = config.type;
        useCompression = config.compress ?? false;
        await ensureDirExists(dbPath);
        const files = await fs_1.promises.readdir(dbPath);
        for (const file of files) {
            if (!file.endsWith('.json'))
                continue;
            try {
                const table = file.slice(0, -5);
                const filepath = path_1.default.join(dbPath, file);
                const tableData = await readFileWithFD(filepath);
                if (dbType === 'kv') {
                    dirty.set('default', { ...dirty.get('default'), ...tableData });
                }
                else {
                    dirty.set(table, tableData);
                }
            }
            catch (e) {
                console.error(`Error loading ${file}:`, e);
            }
        }
        startSync();
        exports.status = isLoaded = true;
        return true;
    }
    catch (e) {
        console.error('Load error:', e);
        return false;
    }
}
async function flush() {
    return syncToFiles();
}
function info() {
    return {
        version: "1.0.0",
        author: "CR072",
        async: false,
        initStatus: isLoaded,
        type: dbType,
        compression: useCompression,
        storagePath: dbPath,
        functions: ["get", "set", "delete", "reset", "init"]
    };
}
const dynabase = {
    get,
    set,
    delete: remove,
    reset,
    init,
    info,
    flush,
    status: isLoaded
};
['beforeExit', 'SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'].forEach(i => {
    process.on(i, async (error) => {
        if (i !== 'beforeExit') {
            console.log(`Received ${i}${error ? ':' : '.'} ${error || ''}`);
        }
        await flush();
        if (i !== 'beforeExit') {
            process.exit(i === 'SIGINT' ? 0 : 1);
        }
    });
});
exports.default = dynabase;