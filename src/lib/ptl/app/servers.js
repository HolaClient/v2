async function servers(pterodactyl) {
    try {
        if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
            try {
                let a = 1;
                let b = 1;
                let c = [];
                while (a <= b) {
                    let d = await fetch(`${pterodactyl.domain}/api/application/servers?per_page=100&page=${a}`, {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${pterodactyl.app}`,
                        },
                    });
                    let e = await d.json();
                    c.push(...e.data);
                    b = e.meta.pagination.total_pages;
                    a++;
                }
                await db.set("panel", "servers", c);
                await db.set("timelines", "LASTCACHE.panel-servers", Date.now());
                return c
            } catch (error) {
                return { success: false, error: error }
            }
        } else {
            return { success: false, error: 0 }
        }
    } catch (error) {
        return { success: false, error: error }
    }
};

async function suspend(pterodactyl, a, b) {
    try {
        if (b) {
            await fetch(`${pterodactyl.domain}/api/application/servers/${a.attributes.id}/details`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    "name": a.attributes.name,
                    "user": a.attributes.user,
                    "description": b
                })
            });
        }
        await fetch(`${pterodactyl.domain}/api/application/servers/${a.attributes.id}/suspend`, {
            "method": "POST",
            "headers": {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${pterodactyl.app}`,
            }
        });
        core.log(`${a.attributes.name} ${b}`);
    } catch (error) {
        return { success: false, error: error }
    }
};

async function assign(pterodactyl, a, b) {
    try {
        if (b) {
            await fetch(`${pterodactyl.domain}/api/application/servers/${a.id}/details`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    "name": a.name,
                    "user": parseInt(b),
                })
            });
        }
    } catch (error) {
        return { success: false, error: error }
    }
};

async function remove(pterodactyl, a) {
    try {
        await fetch(`${pterodactyl.domain}/api/application/servers/${a}/force`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${pterodactyl.app}`,
                Accept: "application/json"
            }
        });
        return
    } catch (error) {
        return { success: false, error: error }
    }
};

async function files(pterodactyl) {
    try {
        if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
            const d = await ptero.servers.getAll()
            await Promise.all(d.map(async (c) => {
                let a = await directory(c, "", pterodactyl);
                let b = await cacheDB.get("pterodactyl-files") || {};
                b[c.attributes.identifier] = a;
                await cacheDB.set("pterodactyl-files", b);
            }));
        }
    } catch (error) {
        return { success: false, error: error }
    }
}

async function directory(f, g, pterodactyl) {
    try {
        let e = [];
        let a = await fetch(`${pterodactyl.domain}/api/client/servers/${f.attributes.identifier}/files/list?directory=${g}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${pterodactyl.acc}`,
            },
        });
        let b = await a.json();
        if (!Array.isArray(b.data)) return e;
        await Promise.all(b.data.map(async (c) => {
            e.push(c);
            if (c.attributes.mimetype === "inode/directory") {
                let d = await directory(f, `${g}/${c.attributes.name}`);
                e.push(d);
            }
        }));
        return e;
    } catch (error) {
        return {};
    }
}

async function changeState(pterodactyl, a, b) {
    if (pterodactyl && pterodactyl.domain && pterodactyl.acc) {
        try {
            let d = await fetch(`${pterodactyl.domain}/api/client/servers/${a}/power`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${pterodactyl.acc}`,
                },
                body: JSON.stringify({ signal: b })
            });
            return { success: true }
        } catch (error) {
            return { success: false, error: error }
        }
    }
};

async function sendCommand(pterodactyl, a, b) {
    if (pterodactyl && pterodactyl.domain && pterodactyl.acc) {
        try {
            let d = await fetch(`${pterodactyl.domain}/api/client/servers/${a}/command`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${pterodactyl.acc}`,
                },
                body: JSON.stringify({ command: b })
            });
            if (d.ok) {
                let e = await d.json()
                return { success: true, data: e }
            } else {
                return { success: false, error: d.json() }
            }
        } catch (error) {
            return { success: false, error: error }
        }
    }
};

async function create(pterodactyl, a) {
    try {
        if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
            let d = await fetch(`${pterodactyl.domain}/api/application/servers`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                },
                body: JSON.stringify(a)
            });
            let e = await d.json();
            return { success: true, data: e }
        } else {
            return { success: false, error: 0 }
        }
    } catch (error) {
        return { success: false, error: error }
    }
}

module.exports = {
    servers, suspend, assign, delete: remove, files, changeState, sendCommand, create
}