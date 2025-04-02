const crypto = require('crypto');

function generate(a, b) {
    const c = crypto.randomBytes(a);
    let d = '';
    for (let i = 0; i < a; i++) {
        d += b.charAt(c[i] % b.length);
    }
    return d;
}

function hash (key) {
    function check(a) {
        const b = 32;
        const c = Buffer.from(a, 'utf-8').length;
        if (c < b) {
            const d = b - c;
            const e = Buffer.alloc(d, '\0');
            return Buffer.concat([Buffer.from(a, 'utf-8'), e], b);
        } else if (c > b) {
            return Buffer.from(a, 'utf-8').slice(0, b);
        }
        return Buffer.from(a, 'utf-8');
    }
    function hash(a) {
        const b = crypto.createHash('sha256');
        b.update(a);
        return b.digest('hex');
    }
    return hash(check(key));
};

function getKey(key) {
    const a = 32;
    const b = Buffer.from(key, 'utf-8');
    if (b.length < a) {
        const c = Buffer.alloc(a);
        b.copy(c);
        return c;
    } else if (b.length > a) {
        return b.slice(0, a);
    }
    return b;
}

function encrypt (a, b) {
    const c = crypto.randomBytes(16);
    const d = crypto.createCipheriv('aes-256-cbc', b ? getKey(b) : getKey(process.env.APP_KEY), c);
    let e = d.update(a, 'utf-8', 'hex');
    e += d.final('hex');
    const f = getKey(process.env.APP_HMAC);
    const g = crypto.createHmac('sha256', f);
    g.update(e);
    return { iv: c.toString('hex'), hash: e, hmac: g.digest('hex') };
};

function decrypt (a, b) {
    try {
        const c = Buffer.from(a.iv, 'hex');
        const d = crypto.createDecipheriv('aes-256-cbc', b ? getKey(b) : getKey(process.env.APP_KEY), c);
        let e = d.update(a.hash, 'hex', 'utf-8');
        e += d.final('utf-8');
        const f = getKey(process.env.APP_HMAC);
        const g = crypto.createHmac('sha256', f);
        g.update(a.hash);
        const h = g.digest('hex');
        if (h !== a.hmac) {
            System.err.println(`HMAC mismatch. Possible tampering detected! ${JSON.stringify(a)}`);
            return '';
        }
        return e;
    } catch (error) {
        System.err.println(error)
        return ""
    }
};

module.exports = {
    gen: function (a, b) {
        const d = {
            88: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?",
            62: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
            52: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
            36: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            26: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            "26S": "abcdefghijklmnopqrstuvwxyz",
            10: "1234567890",
        };
        const c = d[a] || d[62];
        return generate(b, c);
    },
    base64: function (a, b) {
        if (b) {
            return `base64:${Buffer.from(b, 'utf-8').toString('base64')}`
        } else {
            return `base64:${Buffer.from(module.exports.gen(62, a), 'utf-8').toString('base64')}`
        }
    },
    hash, encrypt, decrypt
};
/**
 *--------------------------------------------------------------------------
 * End of file
 *--------------------------------------------------------------------------
*/