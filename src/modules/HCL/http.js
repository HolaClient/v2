/**
 *--------------------------------------------------------------------------
 * The actual handler code.
 *--------------------------------------------------------------------------
*/
const fs = require('fs');
const path = require('path');

const a = './storage/logs/http';
const b = `log_${formatDate(new Date())}.txt`;
const c = fs.createWriteStream(path.join(a, b), { flags: 'a' });
c.write(`\n==========LOG ${formatDate(new Date(), true)}==============\n\n`);
let d = 0;
const logCache = [];
let hasNewEntries = false;
setInterval(writeLogsToFile, 5000);

module.exports = (req) => {
    d++;
    logCache.push(`${formatDate(new Date(), true)} ${d}: ${JSON.stringify(req)}`);
    hasNewEntries = true;
}

function writeLogsToFile() {
    if (hasNewEntries && logCache.length > 0) {
        c.write(logCache.join('\n') + '\n');
        logCache.length = 0;
        hasNewEntries = false;
    }
}

function formatDate(a, b) {
    const c = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!b || b !== true) {
        return `${a.getDate().toString().padStart(2, '0')}-${c[a.getMonth()]}-${a.getFullYear()}`;
    } else {
        return `${a.getDate().toString().padStart(2, '0')}-${c[a.getMonth()]}-${a.getFullYear()} ${a.getHours().toString().padStart(2, '0')}:${a.getMinutes().toString().padStart(2, '0')}`;
    }
}
/**
 *--------------------------------------------------------------------------
 * End of file
 *--------------------------------------------------------------------------
*/