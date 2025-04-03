const discord = require("./providers/discord");
const google = require("./providers/google");
const logout = require("./providers/logout");
const fs = require("fs");

module.exports = async (db, user, req, forced = false) => {
    try {
        let blist = JSON.parse(fs.readFileSync("./blacklist.json"));
        if (blist.includes(user.email)) return {
            success: false,
            code: 403,
            data: "You're blacklisted from accessing our services!"
        };
        let password = hc.secrets.gen(62, 12);
        let a = db.get("users", "users") || [];
        let b = a.find(i => i.email == user.email || i.username == user.username);
        let c;
        if (b) {
            if (forced === true) {
                c = b;
            }
            let k = db.get("pterodactyl", "users") || [];
            let l = k.find(i => i.email == b.email);
            if (!l) {
                let result = await hc.ptl.getMain().users.create({
                    username: b.username,
                    email: b.email,
                    first_name: b.nickname,
                    last_name: b.nickname,
                    password,
                });
                if (result.success == true && result?.data && result?.data?.attributes) {
                    k.push(result?.data?.attributes);
                    db.set("pterodactyl", "users", k);
                } else {
                    System.err.println(result);
                }
            }
        } else {
            let d = db.get("users", "users") || [];
            c = {
                email: user.email,
                username: user.username,
                nickname: user.nickname,
                avatar: user.avatar,
                id: user.id,
                created: Date.now(),
                lastlogin: Date.now(),
                lastip: req.ip,
                vendor: user.vendor,
                password: hc.secrets.encrypt(password)
            };
            d.push(c);

            let g = {
                email: user.email,
                id: user.id,
                intents: [],
                roles: ["user"]
            }
            let h = db.get("permissions", "users") || [];
            h.push(g);

            let j = {
                memory: getRes("memory"),
                cpu: getRes("cpu"),
                disk: getRes("disk"),
                allocations: getRes("allocations"),
                backups: getRes("backups"),
                databases: getRes("databases"),
                subdomains: getRes("subdomains")
            }

            function getRes(key) {
                return hc.settings.resources[key] || 0;
            }

            db.set("users", "users", d);
            db.set("permissions", "users", h);
            db.set("economy", user.email, {
                coins: 0,
                credits: 0,
                tokens: 0
            });
            db.set("resources", user.email, j);

            let result = await hc.ptl.getMain().users.create({
                username: user.username,
                email: user.email,
                first_name: user.nickname,
                last_name: user.nickname,
                password,
            });
            if (result.success == true && result?.data && result?.data?.attributes) {
                let k = db.get("pterodactyl", "users") || [];
                k.push(result?.data?.attributes);
                db.set("pterodactyl", "users", k);
            }
        }
        if (req) {
            req.session.userinfo = c;
            let d = db.get("permissions", "users");
            d = d.find(i => i.email == c.email);
            if (d) req.session.permissions = d;
            let e = db.get("economy", c.email) || {
                coins: 0,
                credits: 0,
                tokens: 0
            };
            if (e) req.session.economy = e;
        }
        return {
            success: true,
            code: 200,
            data: c
        };
    } catch (error) {
        console.log(error)
        return {
            success: false,
            code: 500,
            message: error
        }
    }
}
module.exports.providers = {
    google, discord, logout
}