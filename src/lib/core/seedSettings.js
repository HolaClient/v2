module.exports = async function () {
    let dir = './app/schema/config';
    let files = fs.readdirSync(dir);
    let config = {};
    let pointers = {};
    files.forEach(file => {
        if (file.endsWith('.json')) {
            let filePath = path.join(dir, file);
            let data = fs.readFileSync(filePath, 'utf8');
            config[file.replace('.json', '')] = JSON.parse(data);
        }
    });
    for ([i, j] of Object.entries(config)) {
        if (typeof j == "object" && j.properties) {
            for ([k, l] of Object.entries(j.properties)) {
                resolve(l)
            }
        }
    }
    function resolve(a) {
        if (typeof a == "object" && (a.type == "object" || a.type == "array")) {
            for ([i, j] of Object.entries(a.properties)) {
                resolve(j)
            }
        } else {
            pointers[a.pointer] = a.default
        }
    }
    let a = await db.get("settings", "pointers") || {}
    for ([i, j] of Object.entries(pointers)) {
        if (!a[i]) {
            a[i] = j
        }
    }
    await db.set("settings", "pointers", a)
}