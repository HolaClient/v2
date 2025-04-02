const colors = require("../utils/colors");
const build = require("./build");
const getRoute = require("./get");
const permissions = require("../../HCP");
let WebSockets = [];
let lastKeepAlive = {};
let intervals = {};

module.exports = (app, config) => {
    app.use(async (req, res, next) => {
        try {
            if (req.method === "GET") {
                if (req.url.startsWith("/api")) return next();
                for (let i of (app.routes["GET"] || [])) {
                    if (i.path === req.url && req.url !== "/") return next();
                }
                let timeline = { start: Date.now() };

                let page = getRoute(req);
                let route = page.route;

                if (route) {
                    let content = await buildPage(req, route, page);
                    if (content.code && content.code === 403) {
                        return res.redirect("/auth");
                    } else if (content.code && content.code === 200) {
                        utils.console.log(`GET ${req.url}, Built in ${Date.now() - timeline.start}ms - ${colors.green("200")}`);
                        res.writeHeader("Content-Type", "text/html");
                        return res.end(content.data.content);
                    }
                } else {
                    utils.console.log(`GET ${req.url}, Built in ${Date.now() - timeline.start}ms - ${colors.red("404")}`);
                    return res.end("404: Not Found");
                }
            }
            next();
        } catch (err) {
            console.error(err);
        }
    });

    app.ws("/api/ws", {
        upgrade: (res, req, data) => app.upgradeWS(res, req, data),
        open: (ws) => {
            try {
                if (!ws.session) return ws.close();
                WebSockets.push(ws);
                let closeInterval = setInterval(() => {
                    try {
                        if (!ws || ws.closed) {
                            clearInterval(closeInterval);
                            return;
                        }
                        if (!lastKeepAlive[ws.headers["sec-websocket-key"]]) return ws.close();
                        if (Date.now() - lastKeepAlive[ws.headers["sec-websocket-key"]] > 60000) return ws.close();
                    } catch (err) {
                        System.err.println(err);
                        clearInterval(closeInterval);
                    }
                }, 65000);
                intervals[ws.headers["sec-websocket-key"]] = closeInterval;
            } catch (error) {
                System.err.println(error);
            }
        },
        message: async (ws, message, isBinary) => {
            try {
                const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder('utf-8').decode(message));
                handleWSMessage(ws, data);
            } catch (error) {
                console.error('[WS] Error handling message:', error);
            }
        },
        close: (ws) => {
            try {
                clearInterval(intervals[ws.headers["sec-websocket-key"]]);
                delete intervals[ws.headers["sec-websocket-key"]];
                WebSockets = WebSockets.filter(i => i !== ws);
            } catch (error) { }
        }
    });

    async function handleWSMessage(ws, data) {
        switch (data.type) {
            case "keepalive":
                lastKeepAlive[ws.headers["sec-websocket-key"]] = Date.now();
                break;
            case "getPage":
                let page = getRoute(data.path, "url");
                let route = page.route;
                if (route) {
                    let content = await buildPage(ws, route, page, true);
                    ws.send(JSON.stringify({ type: "routeData", path: data.path, data: content }));
                } else {
                    ws.send(JSON.stringify({ type: "routeData", path: data.path, data: "404: Not Found" }));
                }
                break;
        }
    }

    async function buildPage(req, route, page, ws = false) {
        let pageIntent = route.meta.permissions.intent;
        if (pageIntent && pageIntent !== "") {
            let status = await permissions.check.request(req, `hc.pages.${pageIntent}`);
            if (status.code === 200) {
                return { code: 200, data: build.http(req, route, { params: page.params }) };
            } else {
                return { code: 403, content: "403: Forbidden" };
            }
        } else {
            return { code: 200, data: build.http(req, route, { params: page.params }) };
        }
    }
}

module.exports.WebSockets = () => { return WebSockets };
module.exports.removeWS = (ws) => {
    WebSockets = WebSockets.filter(i => i !== ws);
    clearInterval(intervals[ws.headers["sec-websocket-key"]]);
}