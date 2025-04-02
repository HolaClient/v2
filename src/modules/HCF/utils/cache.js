const map = new Map();

function set(a, b) {
    map.set(a, b);
}

function get(a) {
    return map.get(a);
}

function clear() {
    map.clear();
}

module.exports = {
    set,
    get,
    clear
};