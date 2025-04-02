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
async function locations(pterodactyl) {
    if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
        try {
            let a = 1;
            let b = 1;
            let c;
            while (a <= b) {
                let d = await fetch(`${pterodactyl.domain}/api/application/locations?include=servers&per_page=100&page=${a}`, {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${pterodactyl.app}`,
                    },
                });
                let e = await d.json();
                c = e.data || []
                b = e.meta.pagination.total_pages;
                a++;
            }
            await db.set("panel", "locations", c);
            await db.set("timelines", "LASTCACHE.panel-locations", Date.now());
            return c
        } catch (error) {
            return { success: false, error: error }
        }
    }
}

async function modifySettings(pterodactyl, b, c) {
    if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
        try {
            let a = await fetch(`${pterodactyl.domain}/api/application/locations/${b}`, {
                method: "PATCH",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                },
                body: JSON.stringify(c)
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

async function deleteLocation(pterodactyl, b) {
    if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
        try {
            let a = await fetch(`${pterodactyl.domain}/api/application/locations/${b}`, {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                }
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

async function createLocation(pterodactyl, b) {
    if (!b.short) return { success: false, error: "Field 'short' is required!" }
    if (pterodactyl && pterodactyl.domain && pterodactyl.app) {
        try {
            let a = await fetch(`${pterodactyl.domain}/api/application/locations`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${pterodactyl.app}`,
                },
                body: JSON.stringify({
                    short: b.short,
                    long: b.long
                })
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
    locations, modifySettings, deleteLocation, createLocation
}