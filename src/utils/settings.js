let c = {};
let d = {};

async function load() {
    let a = db.get("settings", "pointers") || {};
    c = a;
    d = resolve(a);
}

function get(a) {
    return c[a];
}

function raw(pointer) {
    if (!pointer) return null;
    const parts = pointer.split('.');
    let current = d;
    for (const part of parts) {
        if (!current || typeof current !== 'object') {
            return null;
        }
        current = current[part];
    }

    return current;
}

function set(a, b) {
    if (a.startsWith("hcx.settings")) a = a.replace("hcx.settings.", "")
    c[a] = b;
    updateStr(d, a, b);
    setValueToDatabase()
}

function setValueToDatabase() {
    db.set("settings", "pointers", c)
}

function resolve(a) {
    let result = {};
    for (const [i, j] of Object.entries(a)) {
        let keys = i.split(".");
        keys.reduce((acc, cur, idx) => {
            if (idx === keys.length - 1) {
                acc[cur] = j;
            } else {
                if (!acc[cur]) acc[cur] = {};
            }
            return acc[cur];
        }, result);
    }
    return result;
}

function updateStr(e, k, v) {
    let keys = k.split(".");
    keys.reduce((acc, cur, idx) => {
        if (idx === keys.length - 1) {
            acc[cur] = v;
        } else {
            if (!acc[cur]) acc[cur] = {};
        }
        return acc[cur];
    }, e);
}

const handler = {
    get(e, f) {
        if (f in e) {
            return e[f];
        }
        return d[f];
    }
};

const proxy = new Proxy({
    get,
    set,
    load,
    raw,
}, handler);

module.exports = proxy;
