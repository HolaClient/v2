/*
Dear programmer,
When I wrote this code, only God and I understood what I did.
Now, only God knows.
You are welcome to contribute to this project.
May the force be with you.
If you have any questions, please don't contact me.
Do not try to optimize or refactor this code, it'll surely fail.
I'm sorry for the mess.
Good luck.

Total hours wasted: a few sleepless weeks.
*/
function genVarName(a) {
    let charSet = 'abcdefghijklmnopqrstuvwxyz';
    let numSet = '0123456789';
    let b = 1;
    let c = charSet.length;
    let d = '';

    while (a >= c) {
        a -= c;
        b++;
        c = charSet.length * Math.pow(charSet.length + numSet.length, b - 1);
    }

    for (let i = 0; i < b; i++) {
        if (i === 0) {
            let e = a % charSet.length;
            d = charSet[e] + d;
            a = Math.floor(a / charSet.length);
        } else {
            let f = charSet + numSet;
            let e = a % f.length;
            d = f[e] + d;
            a = Math.floor(a / f.length);
        }
    }

    return d;
}
module.exports = function (a) {
    let c = a.replace(/\/\*[\s\S]*?\*\//g, '');
    let map = {};
    let d = /\.((?:\\.|[a-zA-Z0-9_-])+)(?=\s*[{:])/g;
    let e;
    let f = 0;
    let p = /\.([a-zA-Z0-9_-][a-zA-Z0-9_-]*(?:\[[^\]]+\])?(?:\:[a-zA-Z][a-zA-Z0-9_-]*)*(?:\/[0-9]+)?(?:\.[a-zA-Z0-9_-]+)*)/g;
    let q;
    
    while ((q = p.exec(c)) !== null) {
        let r = q[1].split('.');
        r.forEach(s => {
            if (!map[s] && /^[a-zA-Z][\w-]*(?:\[[^\]]+\])?(?:\/[0-9]+)?$/.test(s)) {
                map[s] = genVarName(f++);
            }
        });
    }
    
    while ((e = d.exec(c)) !== null) {
        let g = e[1];
        if (!map[g]) {
            map[g] = genVarName(f++);
        }
    }
    Object.keys(map)
        .sort((a, b) => b.length - a.length)
        .forEach(s => {
            let escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            let pattern = new RegExp(`\\.${escaped}(?=[\\s.:{])`, 'g');
            c = c.replace(pattern, `.${map[s]}`);
        });

    c = c.replace(/\s{2,}/g, ' ').replace(/\n\s*/g, '');

    let l = {};

    for (let i in map) {
        let m = i.replace(/\\/g, '');
        l[m] = map[i];
    }

    return { out: c, keys: l };
};