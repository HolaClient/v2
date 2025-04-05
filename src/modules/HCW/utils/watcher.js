const fs = require("fs"),
    path = require("path");
module.exports = function (t, s) {
    let c;
    const e = new Map();
    return (
        (function t(r) {
            if (!e.has(r))
                try {
                    const n = fs.watch(r, { recursive: !1 }, (e, n) => {
                        if (!n) return;
                        const o = path.join(r, n);
                        clearTimeout(c),
                            (c = setTimeout(() => {
                                s(o);
                            }, 100)),
                            fs.existsSync(o) && fs.statSync(o).isDirectory() && t(o);
                    });
                    e.set(r, n);
                    fs.readdirSync(r).forEach((s) => {
                        const c = path.join(r, s);
                        fs.statSync(c).isDirectory() && t(c);
                    });
                } catch (t) { }
        })(t),
        function () {
            for (const [, t] of e) t.close();
            e.clear();
        }
    );
};
