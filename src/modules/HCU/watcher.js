const chokidar = require("chokidar")
module.exports = function (a, b) {
    let c;
    const d = chokidar.watch(a, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });
    d.on('change', (e) => {
        clearTimeout(c);
        c = setTimeout(() => {
            b(e);
        }, 100);
    }).on('error', (error) => {
        console.error(`Watcher error: ${error}`);
    });
}