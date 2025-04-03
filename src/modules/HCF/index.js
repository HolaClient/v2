global.fs = require("fs");
global.path = require("path");
global.utils = require("./utils");
global.pages = require("./pages");
const router = require("./router");
const css = require("./modules/css");

module.exports = async (app) => {
    let timeline = { start: Date.now() };
    utils.console.log("Loading framework...");

    let config;
    try {
        config = JSON.parse(fs.readFileSync("./fubelt.json"));
    } catch (err) {
        config = { env: "production", views: "./views", public: "./public", layouts: "./views/layouts", components: ["./views/partials"], import_alias: { "@": "./", "@components": "./views/partials", "@layouts": "./views/layouts" } };
    }

    config.env = process.env.APP_ENV || "production";

    timeline["config"] = Date.now();

    [config.views, config.public, config.layouts, ...config.components].forEach(dir => {
        if (!utils.fs.exists(dir)) {
            if (config.env === "development") {
                fs.mkdirSync(dir);
                utils.console.log(`Directory ${dir} has been created.`);
            } else {
                throw new Error(`Directory ${dir} does not exist`);
            }
        }
    });

    timeline["checkedDirs"] = Date.now();

    let views = utils.fs.listAllFiles(config.views);
    let layouts = utils.fs.listAllFiles(config.layouts);
    let components = [];
    config.components.forEach(dir => { components = components.concat(utils.fs.listAllFiles(dir)); });

    timeline["listedAllFiles"] = Date.now();

    views = views.filter(view => !layouts.includes(view) && !components.includes(view));
    layouts = layouts.filter(layout => !components.includes(layout));

    timeline["filteredFiles"] = Date.now();

    utils.cache.set("str.views", views);
    utils.cache.set("str.layouts", layouts);
    utils.cache.set("str.components", components);

    timeline["collectingStats"] = Date.now();
    utils.cache.set("stats.views", views.map(file => {return {  url: pages.parse.path(file, config.views), path: file, type: "page", stat: fs.statSync(file) }}));
    utils.cache.set("stats.layouts", layouts.map(file => {return {  path: file, type: "layout", stat: fs.statSync(file) }}));
    utils.cache.set("stats.components", components.map(file => {return {  path: file, type: "component", stat: fs.statSync(file) }}));
    timeline["cachedStats"] = Date.now();

    timeline["cachedFIles"] = Date.now();

    const routes = views.map(file => pages.parse.content(file, "page", config)).filter(Boolean);
    layouts = layouts.map(file => pages.parse.content(file, "layout", config) || file).filter(Boolean);
    components = components.map(file => pages.parse.content(file, "component", config) || file).filter(Boolean);

    timeline["parsedFiles"] = Date.now();

    utils.cache.set("routes", routes);
    utils.cache.set("layouts", layouts);
    utils.cache.set("components", components);

    timeline["cachedParsedFiles"] = Date.now();

    utils.watcher(config.views, (file, eventType) => {
        let buildStart = Date.now();

        let twStat = fs.statSync("./public/common/tailwind.css");
        let twMin = utils.fs.exists(`${config.public}/common/tailwind.min.css`);
        if (!twMin || twStat.mtimeMs > fs.statSync(`${config.public}/common/tailwind.min.css`).mtimeMs) makeMap(config);
        let appCSS = "";
        if (utils.fs.exists(`${config.public}/global.css`)) appCSS += fs.readFileSync(`${config.public}/global.css`, "utf8");
        //if (utils.fs.exists(`${config.public}/common/tailwind.min.css`)) appCSS += fs.readFileSync(`${config.public}/common/tailwind.min.css`, "utf8");
        /* else */ appCSS += fs.readFileSync(`${config.public}/common/tailwind.css`, "utf8");
        appCSS = appCSS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s{2,}/g, " ").replace(/\n/g, "");
        fs.writeFileSync(`${config.public}/app.css`, appCSS);
        
        if (!file.startsWith("./")) file = `./${file}`;
        
        let type = null;
        let layoutIndex = layouts.findIndex(layout => layout.path === file);
        let routeIndex = routes.findIndex(route => route.path === file);
        let componentIndex = components.findIndex(component => component.path === file);
        
        if (layoutIndex !== -1) type = "layout";
        else if (routeIndex !== -1) type = "page";
        else if (componentIndex !== -1) type = "component";
        
        if (eventType === 'deleted') {
            if (type === "layout" && layoutIndex !== -1) layouts.splice(layoutIndex, 1);
            else if (type === "page" && routeIndex !== -1) routes.splice(routeIndex, 1);
            else if (type === "component" && componentIndex !== -1) components.splice(componentIndex, 1);
            
            if (config.env === "development") utils.console.log(`Deleted ${file} in ${Date.now() - buildStart}ms`);
        } else {
            const newContent = pages.parse.content(file, type || determineFileType(file, config), config);
            if (!newContent) return;
            
            if (type === "layout") {
                if (layoutIndex !== -1) layouts[layoutIndex] = newContent;
                else layouts.push(newContent);
            } else if (type === "page") {
                if (routeIndex !== -1) routes[routeIndex] = newContent;
                else routes.push(newContent);
            } else if (type === "component") {
                if (componentIndex !== -1) components[componentIndex] = newContent;
                else components.push(newContent);
            } else {
                const fileType = determineFileType(file, config);
                if (fileType === "layout") layouts.push(newContent);
                else if (fileType === "page") routes.push(newContent);
                else if (fileType === "component") components.push(newContent);
            }
        }
        
        utils.cache.set("routes", routes);
        utils.cache.set("layouts", layouts);
        utils.cache.set("components", components);
        
        if (config.env === "development") {
            utils.console.log(`${eventType} ${file} in ${Date.now() - buildStart}ms`);
            router.WebSockets().forEach(i => {
                try {
                    i.send(JSON.stringify({ type: "reload" }))
                } catch (error) {
                    router.removeWS(i);
                }
            })
        }
    });

    timeline["loadedWatcher"] = Date.now();

    function determineFileType(file, config) {
        if (file.startsWith(config.layouts)) return "layout";
        if (config.components.some(dir => file.startsWith(dir))) return "component";
        return "page";
    }

    router(app, config);

    timeline["initializedRouter"] = Date.now();

    if (config.env === "development" && process.argv.includes("--verbose") || config.log_level === "verbose") {
        Object.keys(timeline).forEach((key, index, array) => {
            if (index === 0) return;
            let diff = timeline[key] - timeline[array[index - 1]];
            utils.console.log(`${key}: ${diff}ms`);
        });
    }

    let dir = path.join(config.public, "framework");
    if (!utils.fs.exists(dir)) fs.mkdirSync(dir);
    utils.fs.copy(path.posix.join(__dirname, `./config/main.js`),`${config.public}/framework/main.js`);

    let twStat = fs.statSync("./public/common/tailwind.css");
    let twMin = utils.fs.exists(`${config.public}/common/tailwind.min.css`);
    if (!twMin || twStat.mtimeMs > fs.statSync(`${config.public}/common/tailwind.min.css`).mtimeMs) makeMap(config);
    let appCSS = "";
    if (utils.fs.exists(`${config.public}/global.css`)) appCSS += fs.readFileSync(`${config.public}/global.css`, "utf8");
    //if (utils.fs.exists(`${config.public}/common/tailwind.min.css`)) appCSS += fs.readFileSync(`${config.public}/common/tailwind.min.css`, "utf8");
    /* else */ appCSS += fs.readFileSync(`${config.public}/common/tailwind.css`, "utf8");
    appCSS = appCSS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s{2,}/g, " ").replace(/\n/g, "");
    fs.writeFileSync(`${config.public}/app.css`, appCSS);

    utils.console.log(`Framework loaded in ${Date.now() - timeline.start}ms`);
}

function makeMap(config) {
    let twCSS = css.compress(fs.readFileSync("./public/common/tailwind.css", "utf8"));
    fs.writeFileSync(`${config.public}/common/tailwind.min.css`, twCSS.out);
    fs.writeFileSync(path.posix.join(__dirname, `./config/tailwind.map`), JSON.stringify(twCSS.keys));
}