/**
 *--------------------------------------------------------------------------
 *  _    _       _        _____ _ _            _          ___  
 * | |  | |     | |      / ____| (_)          | |        |__ \ 
 * | |__| | ___ | | __ _| |    | |_  ___ _ __ | |_  __   __ ) |
 * |  __  |/ _ \| |/ _` | |    | | |/ _ \ '_ \| __| \ \ / // / 
 * | |  | | (_) | | (_| | |____| | |  __/ | | | |_   \ V // /_ 
 * |_|  |_|\___/|_|\__,_|\_____|_|_|\___|_| |_|\__|   \_/|____|
 *--------------------------------------------------------------------------
 *
 * https://holaclient.dev/v2
 * https://github.com/HolaClient/v2
 * https://discord.gg/CvqRH9TrYK
 * 
 * @author CR072 <cr072@holaclient.dev>
 * @copyright 2021 - present HolaClient
 * @version 1
 *
 *--------------------------------------------------------------------------
 * app.js - Application startup file.
 *--------------------------------------------------------------------------
*/
module.exports.api = async function (req, res, next) {
    try {
        if (!req.session.userinfo && hcx.core.cookies.get(req, "hc.sk")) {
            let a = JSON.parse(hcx.core.cookies.get(req, "hc.sk"))
            let b = await db.get("users", a.user)
            if (b) {
                let c = crypt.decrypt(a, b.sessions.secret)
                if (c && c === b.sessions.key) {
                    req.session.userinfo = b
                }
            }
        }
        if (req.session.userinfo && req.session.userinfo.permissions.level > 100) next();
        let a = req.headers
        if (!a["x-auth-type"]) return core.json(req, res, false, "MISSING", "", 1404)
        if (a["x-auth-type"] === "hc.ap") {
            let a = await db.get("api", "keys") || []
            if (a.find(i => i.key === `Bearer ${req.headers["authorization"]}` || i.key === req.headers["x-api-key"])) next()
        } else if (a["x-auth-type"] === "hc.sk") {
            if (!req.headers["x-session-key"]) return core.json(req, res, false, "MISSING", "", 1404)
            const a = req.headers["x-session-key"].split("::");
            if (a.length !== 2) return core.json(req, res, false, "INVALIDFORMAT", "", 1400)
            let b = await db.get("users", a[0]) || []
            if (b.find(i => i.key === a[1])) next()
        }
        return core.json(req, res, false, "ERROR", "", 1400)
    } catch (error) {
        System.err.println(error)
    }
};