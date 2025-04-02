function extractClassesFromHTML(a) {
    const b = /class=["]([^"]+)["]/g;
    
    const c = new Set();
    let d;
    
    while ((d = b.exec(a)) !== null) {
        if (d[1]) {
            const e = d[1].split(" ") || [];
            e.forEach(f => {
                if (f) c.add(f.trim());
            });
        }
    }
    
    return Array.from(c);
}

function extractCSSForClasses(a, b) {
    const c = a.split('}');
    const d = [];

    for (const e of c) {
        if (!e.trim()) continue;
        
        const f = b.some(g => {
            const h = g.replace(/([^\w\d-])/g, '\\$1');
            return e.includes(`.${h}`);
        });

        if (f) {
            d.push(e + '}');
        }
    }

    return d.join('\n').trim();
}

function extractCSS(a) {
    const b = a.split('}');
    const c = {};
    for (const d of b) {
        if (!d.trim()) continue;

        const e = d.match(/\.([^\s{]+)\s*{([^}]*)/);
        if (e) {
            const f = e[1];
            const g = e[2].split(';').map(h => h.trim()).filter(h => h);
            c[f] = {};
            for (const h of g) {
                const [i, j] = h.split(':');
                c[f][i.trim()] = j.trim();
            }
        }
    }
    return c;
}

function minimizeCSS(a, b) {
    let c = a;
    for (const [d, e] of Object.entries(b)) {
        const f = d.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
        const g = e.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
        c = c.replace(new RegExp(f, 'g'), g);
    }
    return c;
}

module.exports.html = extractClassesFromHTML;
module.exports.css = {};
module.exports.css.classes = extractCSSForClasses;
module.exports.css.full = extractCSS;
module.exports.css.minimize = minimizeCSS;