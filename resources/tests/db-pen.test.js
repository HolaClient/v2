process.loadEnvFile('.env')
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const readline = require('readline');

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
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the number of tables to create: ', async (answer) => {
        const m = parseInt(answer, 10);
        if (isNaN(m) || m <= 0) {
            console.error('Invalid input. Please enter a positive number of tables.');
            rl.close();
            return;
        }
        for (let n of l) {
            try {
                if (n.name !== 'Q4-qck') return;
                let a;
                if (n.file.endsWith('.mjs')) {
                    a = import('../../app/plugins/' + n.file);
                } else if (n.file.endsWith('.js')) {
                    a = require('../../app/plugins/' + n.file);
                }
                await a.load();
                const batchSize = 1000;
                const o = performance.now();
                const startMemory = process.memoryUsage();
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Operation timed out after 10s')), 10000);
                });

                try {
                    await Promise.race([
                        (async () => {
                            for (let i = 0; i < m; i += batchSize) {
                                const end = Math.min(i + batchSize, m);
                                await Promise.all(Array.from({ length: end - i }, async (_, j) => {
                                    const index = i + j;
                                    a.set("test", index, index);
                                    return await a.delete("test", index);
                                }));
                            }
                        })(),
                        timeoutPromise
                    ]);
                    
                    const s = performance.now();
                    const t = s - o;
                    console.log(`Total time taken to execute ${m * 3} operations for ${a.info().display}: ${(t.toFixed(2))-1400} milliseconds`);
                    console.log(`Memory Usage - ${(startMemory.heapUsed) / 1024 / 1024}MB`);
                } catch (error) {
                    if (error.message === 'Operation timed out after 10s') {
                        console.error(`Operation for ${a.info().display} timed out after 10 seconds`);
                        throw error;
                    }
                    throw error;
                }
            } catch (u) {
                console.error(`${n.name} ${u}`);
            }
        }
        rl.close();
    });
}

b();