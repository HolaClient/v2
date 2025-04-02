const removeDuplicateValuesFromArray = require('./utils/removeDuplicateValuesFromArray');
const crypt = require('./utils/crypto');
const cookies = require('./utils/cookies');
let sessions = new Map();
let MAX_MEMORY_LIMIT = 512;
let DROP_COUNT = 5;
let CURRENT_MEMORY_USAGE = 0;
let sessionsLoaded = false

async function loadSessions() {
    const sessionData = db.get("sessions", "all");
    if (sessionData) {
        sessionData.forEach(session => {
            sessions.set(session.session.identifier, session);
        });
    }
    sessionsLoaded = true;
}

function manageMemoryUsage() {
    CURRENT_MEMORY_USAGE = (sessions.size * 1.5 * 1024) / (1024 * 1024);
    if (CURRENT_MEMORY_USAGE > MAX_MEMORY_LIMIT) {
        const keysToDelete = Array.from(sessions.keys()).slice(0, DROP_COUNT);
        keysToDelete.forEach(key => {
            sessions.delete(key);
            const index = sessionIDs.indexOf(key);
            if (index > -1) sessionIDs.splice(index, 1);
        });
        CURRENT_MEMORY_USAGE = (sessions.size * 1.5 * 1024) / (1024 * 1024);
    }
}

function parseCookies(cookieHeader = '') {
    const parsedCookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [key, ...val] = cookie.split('=');
        parsedCookies[key.trim()] = decodeURIComponent(val.join('='));
    });
    return parsedCookies;
}

module.exports = async (req, res, next) => {
    const cookieHeader = req.headers.cookie || '';
    try {
        manageMemoryUsage();
        
        const parsedCookies = parseCookies(cookieHeader);
        let sessionID = parsedCookies['hc.ss'];

        if (sessionID && sessions.has(sessionID)) {
            req.session = sessions.get(sessionID);
        } else {
            sessionID = crypt.gen(62, 64).toString('hex');
            req.session = {
                session: {
                    created: Date.now(),
                    identifier: sessionID,
                    lastlogin: Date.now(),
                    headers: req.headers,
                },
                permissions: {
                    intents: [],
                    roles: ['guest'],
                },
                destroy: function () {
                    sessions.delete(sessionID);
                    cookies.set(res, 'hc.ss', '', { maxAge: 0 });
                }
            };
            sessions.set(sessionID, req.session);
            cookies.set(res, 'hc.ss', sessionID);
        }
        if (req.session.userinfo) {
            req.session.economy = db.get("economy", req.session.userinfo.email) || {};
        }

        if (!req.session.permissions) {
            if (req.session.userinfo) {
                req.session.permissions = await permissions.users.get(req?.session?.userinfo?.email);
            } else {
                req.session.permissions = {
                    intents: [],
                    roles: ['guest'],
                };
            }
        }

        req.session.permissions.intents = removeDuplicateValuesFromArray(req.session.permissions.intents);

        const originalEnd = res.end;
        res.end = function (...args) {
            sessions.set(sessionID, req.session);
            db.set("sessions", "all", Array.from(sessions.values()));
            return originalEnd.apply(res, args);
        };

        next();
    } catch (error) {
        console.error('[Sessions Middleware Error]', error);
        throw error;
    }
};

module.exports.load = loadSessions

module.exports.get = function (sessionID) {
    return sessions.get(sessionID);
};

module.exports.getByCookies = function (cookieHeader) {
    const parsedCookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [key, ...val] = cookie.split('=');
        parsedCookies[key.trim()] = decodeURIComponent(val.join('='));
    });
    return sessions.get(parsedCookies['hc.ss']);
};

module.exports.purge = () => {
    sessions.clear();
};

module.exports.delete = (sessionID) => {
    sessions.delete(sessionID);
}