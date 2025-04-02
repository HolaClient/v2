async function users(pterodactyl) {
    try {
        if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
            try {
                let a = 1;
                let b = 1;
                let c = [];
                while (a <= b) {
                    let d = await fetch(`${pterodactyl.domain}/api/application/users?per_page=100&page=${a}&include=servers`, {
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
                await db.set("panel", "users", c);
                await db.set("timelines", "LASTCACHE.panel-users", Date.now());
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

async function modify(pterodactyl, a, b) {
    try {
        if (b) {
            await fetch(`${pterodactyl.domain}/api/application/users/${a}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                    Accept: "application/json"
                },
                body: JSON.stringify(b)
            });
            return { success: true }
        }
    } catch (error) {
        return { success: false, error: error }
    }
};

async function remove(pterodactyl, a) {
    try {
        await fetch(`${pterodactyl.domain}/api/application/users/${a}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${pterodactyl.app}`,
                Accept: "application/json"
            }
        });
        return { success: true }
    } catch (error) {
        return { success: false, error: error }
    }
};

async function create(pterodactyl, a) {
    try {
        if (a) {
            let b = await fetch(`${pterodactyl.domain}/api/application/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                    Accept: "application/json"
                },
                body: JSON.stringify(a)
            });
            let c = await b.json();
            if (c.errors && c.errors[0].status == 422) {
                let d = await fetch(`${pterodactyl.domain}/api/application/users?filter[email]=${a.email}`, {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${pterodactyl.app}`,
                    },
                });
                let e = await d.json();
                return { success: true, data: e.data[0] }
            } else {
                return { success: true, data: c }
            }
        }
    } catch (error) {
        return { success: false, error: error }
    }
}

module.exports = {
    users, delete: remove, modify, create
}