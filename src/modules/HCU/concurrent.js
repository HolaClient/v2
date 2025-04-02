const { spawn } = require('child_process');
const readline = require('readline');
const os = require('os');

function runConcurrently(a, b = {}) {
    const c = [];
    const d = [];
    const e = b.prefix || 'name';
    const f = b.killOthers || false;
    const g = b.successCondition || 'all';
    const h = b.raw || false;
    let i = 0;
    let j = 0;
    let k = false;

    for (const l of a) {
        const m = typeof l === 'string' ? { command: l } : l;
        const n = spawnCommand(m.command, m.name || `${c.length + 1}`, e, h);
        c.push(n);
        d.push(new Promise((o) => {
            n.on('exit', (p) => {
                i++;
                if (p === 0) {
                    j++;
                }
                if (!k && ((g === 'first' && p === 0) || i === c.length)) {
                    k = true;
                    if (f) {
                        for (const q of c) {
                            if (!q.killed) {
                                q.kill();
                            }
                        }
                    }
                    const r = j === c.length ? 0 : 1;
                    process.exit(r);
                }
                o(p);
            });
        }));
    }

    return Promise.all(d);
}

function spawnCommand(a, b, c, d) {
    const e = a.split(' ');
    let f = e.shift();
    const g = e;
    const h = spawn(f, g, { 
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: process.env,
        windowsVerbatimArguments: os.platform() === 'win32'
    });

    h.on('error', (error) => {
        console.error(`Error spawning ${f}: ${error.message}`);
    });

    const i = getPrefix(b, c, h.pid);
    if (!d) {
        const j = readline.createInterface({ input: h.stdout });
        j.on('line', (k) => {
            console.log(`${i}${k}`);
        });
        const l = readline.createInterface({ input: h.stderr });
        l.on('line', (k) => {
            console.error(`${i}${k}`);
        });
    } else {
        h.stdout.pipe(process.stdout);
        h.stderr.pipe(process.stderr);
    }
    return h;
}

function getPrefix(a, b, c) {
    let d = '';
    if (b === 'pid') {
        d = `[PID ${c}] `;
    } else if (b === 'name') {
        d = `[${a}] `;
    } else if (b === 'index') {
        d = `[${a}] `;
    } else {
        d = '';
    }
    return d;
}

module.exports = {
    runConcurrently
};
