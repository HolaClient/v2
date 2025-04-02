const css = require("../modules/css");

module.exports.http = (req, route, vars) => {
    let components = utils.cache.get("components");
    let content = route.content;
    let deps = content.match(/require\(['"]([^'"]+)['"]\)/g);
    if (deps) {
        deps.forEach(i => {
            let file = i.replace("require('", "").replace("')", "");
            let component = components.find(c => c.path.replace(".hcx", "") === file);
            if (component) {
                content = content.replace(i, `(() => {${component.content.replace("module.exports =", "return")}})()`);
            }
            else {
                content = content.replace(i, "");
            }
        });
    }

    let Olayout;
    if (route.meta.layout && route.meta.layout !== "null") {
        Olayout = utils.cache.get("layouts").find(l => l.meta.id === route.meta.layout);
    }

    let page;

    if (Olayout) {
        let layout = { ...Olayout };
        let layoutDeps = layout.content.match(/require\(['"]([^'"]+)['"]\)/g);
        if (layoutDeps) {
            layoutDeps.forEach(i => {
                let file = i.replace("require('", "").replace("')", "");
                let component = components.find(c => c.path.replace(".hcx", "") === file);
                if (component) {
                    layout.content = layout.content.replace(i, `(() => {${component.content.replace("module.exports =", "return")}})()`);
                }
                else {
                    layout.content = layout.content.replace(i, "");
                }
            });
        }
        let builtContent = eval(content).data(req, vars);
        let newRoute = { ...route, content: builtContent };
        page = eval(layout.content).data(req, newRoute, vars);
    } else {
        page = eval(content).data(req, vars);
    }

    page = `<!DOCTYPE html>\n<html lang="en">\n${page}\n</html>`;

    let script = `let a = localStorage.getItem("/assets/framework/main.js");
                if (!a) {
                    let b = document.createElement("script");
                    b.src = "/assets/framework/main.js";
                    document.head.appendChild(b);
                } else {
                    let c = document.createElement('script');
                    c.innerHTML = a;
                    document.head.appendChild(c);
                };`;

    page = page.replace("</head>", `<script>${script}</script>\n</head>`);
    page = css.map(page, JSON.parse(fs.readFileSync(path.join(__dirname, "../config/tailwind.map"), "utf8")));
    page = compress(page);

    return { content: page, props: eval(content).props };
}

function compress(content) {
    return content.replace(/\s{2,}/g, ' ').trim().replace(/>\s+</g, '><');
}