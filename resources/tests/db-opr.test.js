process.loadEnvFile('.env')
const fs = require('fs');
const path = require('path');

async function b() {
    function c(d) {
        let e = [];
        const f = fs.readdirSync(d);
        for (let g in f) {
            let h = f[g];
            let i = path.join(d, h);
            var j = fs.statSync(i);

            if (j && j.isFile()) {
                const k = h.replace(/\.(js|ts|mjs)$/, '');
                e.push({ path: i, file: h, name: k });
            } else if (j.isDirectory()) {
                e = e.concat(c(i));
            }
        }
        return e;
    }
    const l = c('./app/plugins') || {};
    for (let n of l) {
        try {
            
            let a;
            if (n.file.endsWith('.mjs')) {
                a = import('../../app/plugins/' + n.file);
            } else if (n.file.endsWith('.js')) {
                a = require('../../app/plugins/' + n.file);
            }
            await a.load();
            let data = {
                date: Date.now()
            }
            console.log(1, await a.get("wtf", "data"));
            await a.set("wtf", "data", data);
            console.log(2, await a.get("wtf", "data"));
            
        } catch (u) {
            console.error(`${n.name} ${u}`);
        }
    }
    return
}

b();