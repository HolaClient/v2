const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function a(b, c = []) {
    const d = fs.readdirSync(b);
    d.forEach(e => {
        const f = path.join(b, e);
        const g = fs.statSync(f);
        if (g.isDirectory()) {
            c = a(f, c);
        } else {
            c.push(f);
        }
    });
    return c;
}

const b = a(path.resolve('./tests'));
for (let c = 0; c < b.length; c++) {
    if (c === 0) {
        console.log(chalk.white("======================================================="));
    }
    d(b[c]);
    setTimeout(() => {
        if (c === b.length - 1) {
            console.log(chalk.white("======================================================="));
        }
    }, 100);
}

async function d(e) {
    let f = await require(e);
    let g = Date.now();
    let h = `[${chalk.gray("hcT")}]`;
    let i = `${h} Testing ${f.info.name}...`;

    process.stdout.write(`${i}\r`);

    let j = await f.test();
    let k = `[${Date.now() - g}ms]`;
    let l = `${h} [${chalk.green(j.code)}] Successfully tested ${f.info.name} ${chalk.gray(k)}`;

    process.stdout.write(`\r${' '.repeat(i.length)}\r${l}\n`);
}