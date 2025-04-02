const colors = require('./colors');

module.exports = {
    log: (message) => {
        console.log(`${colors.gray(`[${formatDate(new Date(), true)}] ${colors.cyan("Fubelt:")}`)} ${message}`);
    }
}

function formatDate(a, b, c) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!b || b !== true) {
      return `${a.getDate().toString().padStart(2, '0')}-${months[a.getMonth()]}-${a.getFullYear()}`;
    } else {
        let year = c ? `-${a.getFullYear()}` : "";
      return `${a.getDate().toString().padStart(2, '0')}-${months[a.getMonth()]}${year} ${a.getHours().toString().padStart(2, '0')}:${a.getMinutes().toString().padStart(2, '0')}`;
    }
  }