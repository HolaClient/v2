const fs = require('fs');
const path = require('path');
let db0 = new Map();
let db1 = new Map();
const watcher = require('./utils/watcher');

function isPathSafe(e, f) {
    const g = path.relative(e, f);
    return g && !g.startsWith('..') && !path.isAbsolute(g);
}

function cacheAndCreateRoutes(e, f) {
    const g = path.resolve(f);

    if (!fs.existsSync(g)) {
        console.error(`[STATIC] Directory not found: ${g}`);
        return;
    }

    watcher(g, (h) => {
        handleFileChange(h, g, e);
    });

    scanDirectory(g, e);
}

function scanDirectory(e, f) {
    
    try {
        let g = fs.readdirSync(e);
        g.forEach(h => {
            const i = path.join(e, h);
            const j = f.split(path.sep).join('/') + '/' + h;

            if (!isPathSafe(process.cwd(), i)) {
                console.error(`[STATIC] Unsafe path detected: ${i}`);
                return;
            }

            if (fs.statSync(i).isDirectory()) {
                scanDirectory(i, j);
            } else {
                addFileRoute(i, j);
            }
        });
    } catch (k) {
        console.error(`[STATIC] Error scanning directory ${e}:`, k);
    }
}

function handleFileChange(e, f, g) {
    try {
        const h = path.relative(f, e);
        const i = path.posix.join(g, h);

        if (fs.existsSync(e) && fs.statSync(e).isFile()) {
            if (app.routes.GET) {
                const routeIndex = app.routes.GET.findIndex(route => route.path === i);
                if (routeIndex !== -1) {
                    app.routes.GET.splice(routeIndex, 1);
                }
            }
            addFileRoute(e, i);
        } else {
            db0.delete(e);
            db1.delete(i);
            if (app.routes.GET) {
                const routeIndex = app.routes.GET.findIndex(route => route.path === i);
                if (routeIndex !== -1) {
                    app.routes.GET.splice(routeIndex, 1);
                }
            }
        }
    } catch (j) {
        console.error(`[STATIC] Error handling file change:`, j);
    }
}

function addFileRoute(e, f) {
    cacheFile(e);
    const publicDir = path.resolve(process.cwd(), 'public');
    let normalizedPath = path
        .relative(publicDir, e)
        .split(path.sep)
        .join('/');
    if (normalizedPath.startsWith('root/')) {
        normalizedPath = '/' + normalizedPath.substring(5);
    } else {
        normalizedPath = path.posix.join(currentEndpoint, normalizedPath);
    }
    
    db1.set(normalizedPath, e);
    if (app.routes.GET) {
        const routeIndex = app.routes.GET.findIndex(g => g.path === f);
        if (routeIndex !== -1) {
            app.routes.GET.splice(routeIndex, 1);
        }
    }
}

let currentEndpoint = '/';

function cacheFile(e) {
    try {
        const f = fs.readFileSync(e);
        db0.set(e, f);
    } catch (g) {
        console.error(`Error caching file ${e}:`, g);
    }
}

function getStaticFile(endpoint) {
    endpoint = endpoint.split(path.sep).join('/');
    endpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    
    const filePath = db1.get(endpoint);
    if (!filePath) {
        return null;
    }
    
    const fileContent = db0.get(filePath);
    if (!fileContent) {
        return null;
    }

    return {
        buffer: fileContent,
        contentType: getContentType(filePath)
    };
}

module.exports = function (e, f) {
    currentEndpoint = e;
    const g = path.isAbsolute(f) ? f : path.resolve(__dirname, '../../../../', f);
    cacheAndCreateRoutes(e, g);
};

function getRoutes() {
    return Array.from(db1.keys());
}

module.exports.routes = getRoutes;
module.exports.getFile = getStaticFile;

function getContentType(e) {
    let f = path.extname(e).toLowerCase();
    switch (f) {
        case '.html': return 'text/html';
        case '.js': return 'text/javascript';
        case '.css': return 'text/css';
        case '.json': return 'application/json';
        case '.txt': return 'text/text';
        case '.ico': return 'image/png';
        case '.png': return 'image/png';
        case '.webp': return 'image/webp';
        case '.jpg': return 'image/jpg';
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.svg': return 'image/svg';
        default: return 'application/octet-stream';
    }
}