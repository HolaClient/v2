let map = new Map();

function get(a) {
    const entry = map.get(a);
    if (entry) {
        return entry.value;
    } else {
        map.delete(a);
        return undefined;
    }
}

function set(a, b) {
    map.set(a, { value: b });
    cleanup();
}

function rm(a) {
    map.delete(a);
}

function cleanup() {
    const now = Date.now();
    for (const [key, entry] of map.entries()) {
        if (entry.expires !== null && entry.expires <= now) {
            map.delete(key);
        }
    }
}

function purge() {
    for (const [key] of map.entries()) {
        map.delete(key);
    }
}

module.exports = { get, set, delete: rm, purge };
/**
 *--------------------------------------------------------------------------
 * End of file
 *--------------------------------------------------------------------------
*/