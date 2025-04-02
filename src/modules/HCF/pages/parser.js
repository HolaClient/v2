module.exports.content = (src, type, config) => {
    let data = fs.readFileSync(src, "utf8");
    data = data.toString()
        .replaceAll(/<>/g, '`')
        .replaceAll(/<\/>/g, '`')
        .replaceAll(/className=/g, "class=")
        .replaceAll("import(", "require(");

    let req = data.match(/require\(['"]([^'"]+)['"]\)/g);
    if (req) {
        req.forEach(r => {
            let file = r.replace("require('", "").replace("')", "");
            let alias = file.split('/')[0];
            if (config.import_alias[alias]) {
                data = data.replace(r, r.replace(alias, config.import_alias[alias]));
            }
        });
    }

    let meta = {};
    if (type === "page" || type === "layout") {
        let lines = data.split("\n");
        let metaLines = [];
        let inMetaBlock = false;
        let openBraces = 0;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.includes("meta = ({")) {
                inMetaBlock = true;
                openBraces++;
                metaLines.push(line);
            } else if (inMetaBlock) {
                metaLines.push(line);
                let openCount = (line.match(/\{/g) || []).length;
                let closeCount = (line.match(/\}/g) || []).length;
                openBraces += openCount - closeCount;
                if (openBraces === 0 && line.includes("})")) {
                    inMetaBlock = false;
                    break;
                }
            }
        }
        let metaContent = metaLines.join('\n');
        meta = eval(metaContent.replace("meta = ", ""));
    }

    return {
        url: type === "page" ? parsePath(src, config.views) : null,
        path: src,
        meta,
        content: data
    };
}

const parsePath = function (a, b) {
    let c = new RegExp(`^.*${b}/?`);
    a = a.replace(c, '');
    a = a.replace('.hcx', '')
    if (!a || a === '/') return '/';
    if (a === 'index') return '/';
    a = a.startsWith('/') ? a : '/' + a;
    if (a.endsWith('/index')) {
        return a.slice(0, -6) || '/';
    }
    return a;
}

module.exports.path = parsePath;