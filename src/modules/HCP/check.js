async function request(req, a) {
    let c;
    if (req.session.userinfo) {
        let users = db.get("permissions", "users") || [];
        c = users.find(i => i.email == req.session.userinfo.email);
    }
    if (!c) c = req.session.permissions || {
        "permissions": {
            "intents": [`hc.roles.guest`],
            "roles": ["guest"]
        }
    };

    let d = c.intents || [];
    d.push(...(await extractIntentsFromRoles(c.roles)));

    let result = await evalIntent(hc.modules.HCU.removeDuplicateValuesFromArray(d), a);

    if (req.session.userinfo) {
        let users = db.get("permissions", "users") || [];
        c = users.find(i => i.email == req.session.userinfo.email);
        if (c) {
            if (c.intents) {
                c.intents = hc.modules.HCU.removeDuplicateValuesFromArray(c.intents);
            } else {
                c.intents = [];
            }
            db.set("permissions", "users", users);
        }
    }

    return result
}

async function extractIntentsFromRoles(roles) {
    let intents = [];

    if (Array.isArray(roles) && roles.length !== 0) {
        for (let i of roles) {
            let f = await hc.modules.HCP.roles.getByName(i.replace("hc.roles.", "").toLowerCase());
            for (let j of f.intents) {
                if (j.startsWith("hc.roles")) {
                    let g = await hc.modules.HCP.roles.getByName(j.replace("hc.roles.", "").toLowerCase());
                    intents.push(...(await extractIntentsFromRoles([g.name])));
                } else {
                    intents.push(j);
                }
            }
        }
    }

    return intents;
}

async function session(req, a) {
    let c = req?.permissions || {
        "permissions": {
            "intents": [`hc.roles.guest`],
            "roles": ["guest"]
        }
    };
    d = c.intents || []
    d.push(...(await extractIntentsFromRoles(c.roles)));
    return await evalIntent(hc.removeDuplicateValuesFromArray(d), a);
}

async function evalIntent(a, b) {
    if (!b || typeof b !== 'string') {
        return hc.res.internal.notfound();
    }
    let c = a.length;
    for (let i = 0; i < c; i++) {
        let d = a[i];
        if (d === b) {
            return hc.res.internal.success();
        }
        if (d.endsWith('.*')) {
            let e = d.slice(0, -2);
            if (b === e || b.startsWith(e + '.')) {
                return hc.res.internal.success();
            }
        }
        if (d.startsWith("hc.roles")) {
            let f = d.split(".")[2];
            let g = (await hc.modules.HCP.roles.getByName(f)).intents;

            let h = 0;
            let j = g.length - 1;
            while (h <= j) {
                let k = Math.floor((h + j) / 2);
                let i = g[k];
                if (i === b) return hc.res.internal.success();
                if (i.endsWith('.*')) {
                    let l = i.slice(0, -2);
                    if (b === l || b.startsWith(l + '.')) {
                        return hc.res.internal.success();
                    }
                }
                if (i < b) {
                    h = k + 1;
                } else {
                    j = k - 1;
                }
            }
        }
    }
    return hc.res.internal.forbidden();
}

module.exports = { request, evalIntent, session };
