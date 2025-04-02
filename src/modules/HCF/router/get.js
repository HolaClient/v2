module.exports = (req, type) => {
    let routes = utils.cache.get("routes");
    let route = null;
    let params = {};
    let url;

    if (type && type !== "req") url = req
    else url = req.url;

    for (let i = 0; i < routes.length; i++) {
        let r = routes[i];
        if (r.url === url) {
            route = r;
            break;
        }
    }

    if (!route) {
        for (const r of routes) {
            if (r.url.includes('[')) {
                const routeParts = r.url.split('/');
                const urlParts = url.split('/');

                if (routeParts.length !== urlParts.length) continue;

                let isMatch = true;
                for (let i = 0; i < routeParts.length; i++) {
                    if (routeParts[i].startsWith('[') && routeParts[i].endsWith(']')) {
                        const paramName = routeParts[i].slice(1, -1);
                        params[paramName] = urlParts[i];
                    } else if (routeParts[i] !== urlParts[i]) {
                        isMatch = false;
                        break;
                    }
                }
                if (isMatch) {
                    route = { ...r, params };
                    break;
                }
            }
        }
    }

    return {  route, params };
}