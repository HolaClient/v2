function all(req) {
    let b = req?.headers?.cookie || req.getHeader('cookie');
    let c = {};
    if (b) {
        b.split(';').forEach(i => {
            let d = i.split('=');
            let e = d.shift().trim();
            try {
                c[e] = decodeURIComponent(d.join('='));
            } catch (e) {
                c[e] = d.join('=');
            }
        });
    }
    return c;
}

function get(req, a) {
    let b = all(req)
    return b[a];
}

function getByHeader(req, a) {
    let b = req
    let c = {};
    if (b) {
        b.split(';').forEach(i => {
            let d = i.split('=');
            let e = d.shift().trim();
            try {
                c[e] = decodeURIComponent(d.join('='));
            } catch (e) {
                c[e] = d.join('=');
            }
        });
    }
    return c[a];
}

function set(res, a, b) {
    const c = 30 * 24 * 60 * 60;
    const d = new Date(Date.now() + c * 1000).toUTCString();
    res.writeHeader('Set-Cookie', `${a}=${b}; Path=/; Expires=${d}; Max-Age=${c};`);
}

function del(res, a) {
    res.writeHeader('Set-Cookie', `${a}=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    return;
}

module.exports = { all, get, set, delete: del, getByHeader }