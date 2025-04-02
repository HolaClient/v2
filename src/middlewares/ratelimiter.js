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
let MAX_REQS_FOR_API_PER_MIN = parseInt(process.env.API_RATELIMIT_PER_MINUTE) ?? 600
let MAX_GLOBAL_REQS_PER_MIN = parseInt(process.env.GLOBAL_RATELIMIT_PER_MINUTE) ?? 1800
let RATELIMITS = {}

module.exports = function (req, res, next) {
    if (req.url.startsWith("/api")) {
        let a = RATELIMITS[req.ip || req.session.identifier]
        a["API"] = (parseInt(a["API"]) - 1) ?? MAX_REQS_FOR_API_PER_MIN - 1
        a["lasttime"] = Date.now()
        RATELIMITS[req.ip || req.session.identifier] = a
        req.setHeader("X-Ratelimit-API" , a["API"])
    } else {
        let a = RATELIMITS[req.ip || req.session.identifier]
        a["GLOBAL"] = (parseInt(a["GLOBAL"]) - 1) ?? MAX_GLOBAL_REQS_PER_MIN - 1
        a["lasttime"] = Date.now()
        RATELIMITS[req.ip || req.session.identifier] = a
        req.setHeader("X-Ratelimit-GLOBAL" , a["GLOBAL"])
    }
}