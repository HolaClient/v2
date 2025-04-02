async function nodes(pterodactyl) {
    if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
        try {
            let a = 1;
            let b = 1;
            let c = [];
            while (a <= b) {
                let d = await fetch(`${pterodactyl.domain}/api/application/nodes?include=allocations,location,servers&per_page=100&page=${a}`, {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${pterodactyl.app}`,
                    },
                });
                let e = await d.json();
                let k = {}
                for (let i of e.data) {
                    k = i
                    let f = await fetch(`${pterodactyl.domain}/api/application/nodes/${i.attributes.id}/configuration`, {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${pterodactyl.app}`,
                        },
                    });
                    let g = await f.json()
                    let j;
                    try {
                        let response = await fetch(`${i.attributes.scheme}://${i.attributes.fqdn}:${i.attributes.daemon_listen}/api/system?v=2`, {
                            method: "GET",
                            headers: {
                                Accept: "application/json",
                                Authorization: `Bearer ${g.token}`,
                            },
                        });

                        if (response.ok) {
                            let data = await response.json();
                            j = data;
                        } else {
                            console.error('Failed to fetch data, HTTP status:', response.status);
                        }
                    } catch (error) {
                        if (error.cause && error.cause.code !== 'ECONNREFUSED') {
                            console.error('Error fetching data:', error);
                        }
                    }
                    k.attributes["system"] = j || {}
                    k.attributes["configuration"] = g
                    c.push(k);
                }
                b = e.meta.pagination.total_pages;
                a++;
            }
            await db.set("panel", "nodes", c);
            await db.set("timelines", "LASTCACHE.panel-nodes", Date.now());
            return c
        } catch (error) {
            return { success: false, error: error }
        }
    }
}

async function changeLocation(pterodactyl, b, c) {
    if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
        try {
            let e = db.get("panel", "nodes")
            let f = e.find(i => i.attributes.id == parseInt(b))
            let g = f.attributes
            delete g["relationships"]
            delete g["system"]
            delete g["configuration"]
            g["location_id"] = c
            let a = await fetch(`${pterodactyl.domain}/api/application/nodes/${b}`, {
                method: "PATCH",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                },
                body: JSON.stringify(g)
            });
            if (a.ok) {
                nodes()
                return { success: true }
            } else {
                return { success: false, error: await a.json() };
            }
        } catch (error) {
            return { success: false, error: error }
        }
    }
}

module.exports = {
    nodes, changeLocation
}