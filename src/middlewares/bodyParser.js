module.exports = async function (req, res, next) {
    const a = new Promise((resolve) => {
        let body = '';
        let b = req.headers['content-type'] || '';
        res.onData((chunk, c) => {
            body += Buffer.from(chunk).toString();
            if (c) {
                let d;
                if (b.includes('application/json')) {
                    try {
                        d = body;
                    } catch (e) {
                        d = null;
                    }
                } else if (b.includes('application/x-www-form-urlencoded')) {
                    d = Object.fromEntries(new URLSearchParams(body));
                } else {
                    d = body;
                }
                resolve(d);
            }
        });
    });
    req.body = await a
    next()
}