const cookies = require("./utils/cookies");
const sessions = require("./sessions");
const logger = require("../HCL/http");

try {
    let srv;
    try {
        srv = require('./bin/' + process.platform + '_' + process.arch + '_' + process.versions.modules + '.node').App;
    } catch (e) {
        console.log("This version of NodeJS is not supported, please refer to the documentation for more information.");
        process.exit(1);
    }

    const static = require('./static');

    module.exports = () => {
        const app = srv();
        const wares = [];
        const routeCache = new Map();
        const routes = {
            GET: [], POST: [], PUT: [], PATCH: [], DELETE: [],
            OPTIONS: [], HEAD: [], CONNECT: [], TRACE: [], ANY: []
        };

        function use(a, b) {
            if (typeof a === 'function') {
                b = a;
                a = '*';
            }
            wares.push({ path: a, ware: b });
        }

        function registerRoute(method, path, handler) {
            const cached = routeCache.get(path);
            if (cached) {
                routes[method].push({ ...cached, handler });
                return;
            }

            const keys = [];
            const pattern = path.replace(/:(\w+)/g, (_, key) => {
                keys.push(key);
                return '([^/]+)';
            });
            const compiledPattern = new RegExp(`^${pattern}$`);
            routeCache.set(path, { path, pattern: compiledPattern, keys });
            routes[method].push({ path, pattern: compiledPattern, keys, handler });
        }

        async function handle(req, res) {
            logger(req);
            const method = req.getMethod().toUpperCase();
            const url = req.getUrl();
            const headers = req.headers;
            let resStatus = false;
            let headersSent = false;

            Object.assign(req, {
                status: false,
                method,
                url,
                query: Object.fromEntries(new URLSearchParams(req.getQuery())),
                params: {},
                headers,
                ip: headers['x-forwarded-for'] || headers['remote-address'] || headers['remote_addr'] || headers.remoteaddress,
                created: Date.now()
            });

            res.onAborted(() => {
                resStatus = true;
                req.status = true;
            });

            req.body = await new Promise((resolve) => {
                if (!headers['content-length']) return resolve(null);

                let body = '';
                res.onData((chunk, isLast) => {
                    body += Buffer.from(chunk).toString();
                    if (isLast) {
                        if (headers['content-type']?.includes('application/json')) {
                            try {
                                resolve(JSON.parse(body));
                            } catch {
                                resolve(body);
                            }
                        } else {
                            resolve(body);
                        }
                    }
                });
            });

            if (resStatus) return;
            const end = res.end.bind(res);
            const sendResponse = (data, contentType) => {
                if (!resStatus && !headersSent) {
                    headersSent = true;
                    res.cork(() => {
                        if (contentType) res.writeHeader('Content-Type', contentType);
                        res.writeHeader('X-Powered-By', 'HolaClient-W Legacy');
                        res.writeHeader('HolaClient', 'v2-mini');
                        end(data);
                    });
                }
            };

            res.json = (data) => sendResponse(JSON.stringify(data), 'application/json');
            res.end = (data) => sendResponse(data);
            res.redirect = (url) => {
                sendResponse(
                    `<script>location.href="${url}"</script>`,
                    'text/html'
                );
            };

            let middlewareIndex = 0;
            const runMiddlewares = async () => {
                while (middlewareIndex < wares.length) {
                    const { path, ware } = wares[middlewareIndex++];
                    if (path === '*' || path === url) {
                        try {
                            await ware(req, res, runMiddlewares);
                            return;
                        } catch (err) {
                            throw err;
                        }
                    }
                }

                if (routes[method]) {
                    for (const route of routes[method]) {
                        const match = url.match(route.pattern);
                        if (match) {
                            try {
                                await route.handler(req, res);
                                return;
                            } catch (err) {
                                throw err;
                            }
                        }
                    }
                    res.end('Not Found');
                } else {
                    res.setStatus(405);
                    res.end('Method Not Allowed');
                }
            };

            try {
                await runMiddlewares();
            } catch (error) {
                console.error('Handler error:', error);
                if (!resStatus && !headersSent) {
                    res.end('500: Internal Server Error. HCWL160');
                }
            }
        }

        let IPs = {};
        let RATE_LIMIT = 120;
        const WINDOW_MS = 60000;
        let requestCount = 0;
        let lastCheck = Date.now();

        setInterval(() => {
            const now = Date.now();
            for (const ip in IPs) {
                if (now - IPs[ip].timestamp > WINDOW_MS) {
                    delete IPs[ip];
                }
            }
            const timeDiff = (now - lastCheck) / 1000;
            const currentRPS = requestCount / timeDiff;
            let wasHighTraffic = RATE_LIMIT < 120;
            if (currentRPS > 1000) {
                RATE_LIMIT = Math.max(30, RATE_LIMIT - 10);
            } else if (currentRPS < 800 && wasHighTraffic) {
                RATE_LIMIT = Math.min(120, RATE_LIMIT + 5);
            }
            requestCount = 0;
            lastCheck = now;
        }, 2000);

        app.any('/*', (res, req) => {
            requestCount++;
            const headers = {};
            req.forEach((key, value) => headers[key.toLowerCase()] = value);
            const ip = headers['x-forwarded-for'] || headers['remote-address'] || headers['remote_addr'] || headers.remoteaddress;
            const now = Date.now();

            if (!IPs[ip] || now - IPs[ip].timestamp > WINDOW_MS) {
                IPs[ip] = { count: 1, timestamp: now };
            } else {
                IPs[ip].count++;
                if (IPs[ip].count > RATE_LIMIT) {
                    res.writeStatus('429 Too Many Requests');
                    res.writeHeader('X-RateLimit-Limit', RATE_LIMIT.toString());
                    res.writeHeader('X-RateLimit-Remaining', '0');
                    const resetInSeconds = Math.ceil((IPs[ip].timestamp + WINDOW_MS) / 1000);
                    res.writeHeader('X-RateLimit-Reset', resetInSeconds.toString());
                    return res.end();
                }
            }

            res.writeHeader('X-RateLimit-Limit', RATE_LIMIT.toString());
            res.writeHeader('X-RateLimit-Remaining', (RATE_LIMIT - IPs[ip].count).toString());
            const resetInSeconds = Math.ceil((IPs[ip].timestamp + WINDOW_MS - Date.now()) / 1000);
            res.writeHeader('X-RateLimit-Reset', resetInSeconds.toString());

            req.headers = headers
            let url = req.getUrl();
            let file = static.getFile(url);

            if (!file) {
                handle(req, res).catch(err => {
                    res.cork(() => {
                        console.log(err);
                        if (!res.aborted) {
                            res.end('500: Internal Server Error. HCWL170');
                        }
                    });
                });
            } else {
                res.writeHeader('Content-Type', file.contentType);
                res.end(file.buffer);
            }
        });

        function listen(port, callback) {
            app.listen(port, (token) => {
                if (token) {
                    if (callback) callback();
                } else {
                    console.log(`Failed to listen on port ${port}`);
                }
            });
        }

        return {
            use,
            static,
            cookies,
            sessions,
            get: (path, handler) => registerRoute('GET', path, handler),
            post: (path, handler) => registerRoute('POST', path, handler),
            put: (path, handler) => registerRoute('PUT', path, handler),
            patch: (path, handler) => registerRoute('PATCH', path, handler),
            delete: (path, handler) => registerRoute('DELETE', path, handler),
            options: (path, handler) => registerRoute('OPTIONS', path, handler),
            head: (path, handler) => registerRoute('HEAD', path, handler),
            connect: (path, handler) => registerRoute('CONNECT', path, handler),
            trace: (path, handler) => registerRoute('TRACE', path, handler),
            any: (path, handler) => registerRoute('ANY', path, handler),
            ws: (path, handler) => app.ws(path, handler),
            listen,
            upgradeWS: require('./utils/upgradeWebSocketConnection'),
            routes
        };
    }
} catch (error) {
    console.error(error);
    return;
}