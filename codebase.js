/**
 *--------------------------------------------------------------------------
 *  _    _       _        _____ _ _            _          ___  
 * | |  | |     | |      / ____| (_)          | |        |__ \ 
 * | |__| | ___ | | __ _| |    | |_  ___ _ __ | |_  __   __ ) |
 * |  __  |/ _ \| |/ _` | |    | | |/ _ \ '_ \| __| \ \ / // / 
 * | |  | | (_) | | (_| | |____| | |  __/ | | | |_   \ V // /_ 
 * |_|  |_|\___/|_|\__,_|\_____|_|_|\___|_| |_|\__|   \_/|____|
 *--------------------------------------------------------------------------
 *
 * https://holaclient.dev/v2
 * https://github.com/HolaClient/v2
 * https://discord.gg/CvqRH9TrYK
 * 
 * @author CR072 <cr072@holaclient.dev>
 * @copyright 2021 - present HolaClient
 * @version 2
 *
 *--------------------------------------------------------------------------
 * codebase.js - Application codebase statistics.
 *--------------------------------------------------------------------------
*/
const { Worker, isMainThread, parentPort } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
require('events').EventEmitter.defaultMaxListeners = 1000;
const extensions = ['.js', '.html', '.css', '.ejs', '.json', '.jsx', '.tsx', '.ts', '.mjs', '.cjs', '.md', '.hcx'];
const WORKER_COUNT = os.cpus().length;
const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', 'coverage',
    'tmp', 'temp', 'logs', 'cache', '.cache', 'codebase.js'
]);

async function getAllFiles(a) {
    const b = new Set();
    const c = [];
    const d = new Set();
    
    async function e(f) {
        const g = await fs.realpath(f);
        if (b.has(g)) return;
        b.add(g);
        
        try {
            const h = await fs.readdir(f, { withFileTypes: true });
            const i = h.filter(j => 
                !j.name.startsWith('.') && 
                !EXCLUDED_DIRS.has(j.name)
            );
            
            const k = async (l) => {
                const m = path.join(f, l.name);
                
                try {
                    if (l.isSymbolicLink()) {
                        const n = await fs.realpath(m);
                        if (!b.has(n)) {
                            const o = await fs.stat(n);
                            if (o.isDirectory()) {
                                return e(n);
                            } else if (o.isFile()) {
                                c.push(n);
                            }
                        }
                    } else if (l.isDirectory()) {
                        return e(m);
                    } else if (l.isFile()) {
                        const p = path.extname(l.name).toLowerCase();
                        if (extensions.includes(p)) {
                            c.push(m);
                        }
                    }
                } catch (q) {
                    console.error(`Error processing ${m}: ${q.message}`);
                }
            };
            
            const r = i.map(s => {
                const t = k(s);
                d.add(t);
                t.finally(() => d.delete(t));
                return t;
            });
            
            await Promise.all(r);
        } catch (u) {
            console.error(`Error reading directory ${f}: ${u.message}`);
        }
    }
    
    await e(a);
    while (d.size > 0) {
        await Promise.race(Array.from(d));
    }
    
    return [...new Set(c)];
}

async function readFiles(a) {
    const b = 1000;
    const c = [];
    
    for (let d = 0; d < a.length; d += b) {
        const e = a.slice(d, d + b);
        const f = e.map(g => 
            fs.readFile(g, 'utf-8')
                .then(h => ({ file: g, content: h }))
                .catch(i => ({ file: g, error: i }))
        );
        
        c.push(...await Promise.all(f));
    }
    
    return c;
}

function createWorker() {
    return new Worker(__filename);
}

function processFileContent(a) {
    const b = {
        variables: {},
        functions: {},
        alphabets: {},
        lines: 0
    };
    
    const c = 1024 * 1024 * 10;
    const d = [];
    
    for (let e = 0; e < a.length; e += c) {
        d.push(a.slice(e, e + c));
    }

    const f = (g) => {
        const h = {
            variables: {},
            functions: {},
            alphabets: {},
            lines: 0
        };

        h.lines = (g.match(/\n/g) || []).length;

        const i = /(?:\b(?:var|let|const)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)|function\s+([a-zA-Z_$][0-9a-zA-Z_$]*))/g;
        let j;

        while ((j = i.exec(g)) !== null) {
            if (j[1]) {
                h.variables[j[1]] = (h.variables[j[1]] || 0) + 1;
            }
            if (j[2]) {
                h.functions[j[2]] = (h.functions[j[2]] || 0) + 1;
            }
        }

        const k = new Uint8Array(26).fill(0);
        for (let l = 0; l < g.length; l++) {
            const m = g.charCodeAt(l) | 0x20;
            if (m >= 97 && m <= 122) {
                k[m - 97]++;
            }
        }
        for (let n = 0; n < 26; n++) {
            if (k[n] > 0) {
                h.alphabets[String.fromCharCode(97 + n)] = k[n];
            }
        }

        return h;
    };

    const o = d.map(f);

    const p = (q, r) => {
        q.lines += r.lines;
        
        Object.entries(r.variables).forEach(([s, t]) => {
            q.variables[s] = (q.variables[s] || 0) + t;
        });
        
        Object.entries(r.functions).forEach(([s, t]) => {
            q.functions[s] = (q.functions[s] || 0) + t;
        });
        
        Object.entries(r.alphabets).forEach(([s, t]) => {
            q.alphabets[s] = (q.alphabets[s] || 0) + t;
        });
        
        return q;
    };

    return o.reduce(p, b);
}

async function main() {
    const a = Date.now();
    console.log("Starting Codebase Analysis...");
    
    console.log("Scanning files...");
    const b = await getAllFiles(path.resolve(__dirname, './'));
    const c = b.filter(n => extensions.includes(path.extname(n)));
    console.log(`Found ${c.length} files to process`);

    const d = Array.from({ length: WORKER_COUNT }, createWorker);
    const e = c;
    const f = [];
    let g = 0;
    let h = 0;

    const i = (j, k) => {
        if (k >= e.length) {
            j.postMessage(null);
            return;
        }

        const l = e[k];
        g++;

        j.postMessage(l);

        j.once('message', m => {
            f.push(m);
            h++;
            
            if (h % 100 === 0 || h === e.length) {
                const n = ((h / e.length) * 100).toFixed(2);
                console.log(`Progress: ${n}% (${h}/${e.length} files)`);
            }
            
            i(j, g);
        });

        j.once('error', o => {
            console.error(`Worker error processing ${l}: ${o.message}`);
            h++;
            f.push({ lines: 0, variables: {}, alphabets: {}, functions: {} });
            i(j, g);
        });
    };

    console.log(`Starting processing with ${WORKER_COUNT} workers...`);
    d.forEach((j, k) => {
        i(j, k);
    });

    await new Promise(a => {
        const b = setInterval(() => {
            if (h === e.length) {
                clearInterval(b);
                a();
            }
        }, 100);
    });

    let o = 0;
    let p = {};
    let q = {};
    let r = {};

    for (const s of f) {
        o += s.lines;

        for (const [t, u] of Object.entries(s.variables)) {
            p[t] = (p[t] || 0) + u;
        }

        for (const [v, w] of Object.entries(s.alphabets)) {
            q[v] = (q[v] || 0) + w;
        }

        for (const [x, y] of Object.entries(s.functions)) {
            r[x] = (r[x] || 0) + y;
        }
    }

    const z = Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const A = Object.entries(q).sort((a, b) => a[0].localeCompare(b[0]));

    console.clear();
    console.log("=======================================================");
    console.log('Top 3 most used variable names:');
    z.forEach(([a, b]) => {
        console.log(`${a}: ${b} times`);
    });
    console.log("\nAlphabet frequencies:");
    console.log(A);
    console.log("\nTotal lines of code:", o);
    console.log("Total files: ", c.length);
    console.log("Total variables:", Object.values(p).reduce((a, b) => a + b, 0));
    console.log("Total letters:", Object.values(q).reduce((a, b) => a + b, 0));
    console.log("Total functions:", parseInt(Object.values(r).reduce((a, b) => a + b, 0)));
    console.log(`Time took: ${Date.now() - a}ms`);
    console.log("=======================================================");

    d.forEach(a => a.terminate());
}


if (isMainThread) {
    process.setMaxListeners(0);
    require('v8').setFlagsFromString('--max_old_space_size=8192');
    
    main().catch(a => {
        console.error(a);
        process.exit(1);
    });
} else {
    parentPort.on('message', async (a) => {
        if (a === null) {
            process.exit(0);
            return;
        }
        
        try {
            const b = await new Promise((c, d) => {
                let e = '';
                const f = require('fs').createReadStream(a, {
                    highWaterMark: 1024 * 1024 * 10
                });
                
                f.on('data', g => e += g);
                f.on('end', () => c(e));
                f.on('error', d);
            });
            
            const c = processFileContent(b);
            parentPort.postMessage(c);
        } catch (d) {
            console.error(`Error processing file ${a}: ${d.message}`);
            parentPort.postMessage({ lines: 0, variables: {}, alphabets: {}, functions: {} });
        }
    });
}