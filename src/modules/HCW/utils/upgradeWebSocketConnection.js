const sessions = require('../sessions');
const cookies = require('../utils/cookies')

module.exports = (res, req, data) => {
    let url = req.getUrl();
    let method = req.getMethod();
    let query = req.getQuery();
    let headers = {};

    req.forEach((key, value) => {
        headers[key] = value;
    });
    
    res.upgrade(
        { url, method, query, headers, session: sessions.get(cookies.get(req, "hc.ss")) },
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        data
    );
}