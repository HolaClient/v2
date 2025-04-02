module.exports = function (a) {
    if (a.length === 0) return a;
    let b = [];
    for (let i = 0; i < a.length; i++) {
        if (i === 0 || !binary(b, a[i])) {
            b.push(a[i]);
        }
    }
    return b;
}
function binary(a, b) {
    let c = 0;
    let d = a.length - 1;
    while (c <= d) {
        let e = Math.floor((c + d) / 2);
        if (a[e] === b) {
            return true;
        } else if (a[e] < b) {
            c = e + 1;
        } else {
            d = e - 1;
        }
    }
    return false;
}