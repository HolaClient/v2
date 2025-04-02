/**
 *--------------------------------------------------------------------------
 * importing modules
 *--------------------------------------------------------------------------
*/
const { Console } = require('console');
/**
 *--------------------------------------------------------------------------
 * The actual handler code.
 *--------------------------------------------------------------------------
*/
const a = './storage/logs/app';
if (process.env.APP_ENV !== "production") {
  const b = `log_${formatDate(new Date(), true).replace(" ", "_").replace(":", "-")}.txt`;
  const c = fs.createWriteStream(path.join(a, b), { flags: 'a' });
  c.write(`==========LOG ${formatDate(new Date(), true)}==============\n`);
  const d = new Console(process.stdout, c);
  d.error = (...f) => {
    c.write(f.join(' ') + '\n');
  };
  const e = console.log;
  console.log = (...f) => {
    e(chalk.gray(`[${formatTime()}]`), ...f);
    c.write(f.join(' ') + '\n');
  };
  global.console = d;
} else {
  const b = `log_${formatDate(new Date())}.txt`;
  const c = fs.createWriteStream(path.join(a, b), { flags: 'a' });
  c.write(`\n==========LOG ${formatDate(new Date(), true)}==============\n\n`);
  const d = new Console(process.stdout, c);
  d.error = (...f) => {
    c.write(f.join(' ') + '\n');
  };
  global.console = d;
  const e = console.log;
  console.log = (...f) => {
    e(chalk.gray(`[${formatTime()}]`), ...f);
    c.write(f.join(' ') + '\n');
  };
}
function formatDate(a, b) {
  const c = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!b || b !== true) {
    return `${a.getDate().toString().padStart(2, '0')}-${c[a.getMonth()]}-${a.getFullYear()}`;
  } else {
    return `${a.getDate().toString().padStart(2, '0')}-${c[a.getMonth()]}-${a.getFullYear()} ${a.getHours().toString().padStart(2, '0')}:${a.getMinutes().toString().padStart(2, '0')}`;
  }
}
function formatTime() {
  const a = new Date()
  return `${a.getDate().toString().padStart(2, '0')}/${[a.getMonth() + 1]} ${a.getHours().toString().padStart(2, '0')}:${a.getMinutes().toString().padStart(2, '0')}`;
}
/**
 *--------------------------------------------------------------------------
 * End of file
 *--------------------------------------------------------------------------
*/