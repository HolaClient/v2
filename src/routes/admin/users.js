module.exports = async () => {
    app.get("/api/admin/roles", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        let roles = db.get("permissions", "roles") || [];
        res.json({ success: true, data: roles });
    });

    app.post("/api/admin/roles", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const { name, level, intents } = req.body;
        if (!name || level === undefined || !intents) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let roles = db.get("permissions", "roles") || [];
        const newRole = {
            id: Math.random().toString().slice(2, 10),
            name,
            level: parseInt(level),
            intents: Array.isArray(intents) ? intents : [intents]
        };

        roles.push(newRole);
        db.set("permissions", "roles", roles);
        res.json({ success: true, data: newRole });
    });

    app.put("/api/admin/roles/:id", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const { name, level, intents } = req.body;
        if (!name || level === undefined || !intents) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let roles = db.get("permissions", "roles") || [];
        const roleIndex = roles.findIndex(r => r.id === req.params.id);
        if (roleIndex === -1) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        roles[roleIndex] = {
            ...roles[roleIndex],
            name,
            level: parseInt(level),
            intents: Array.isArray(intents) ? intents : [intents]
        };

        db.set("permissions", "roles", roles);
        res.json({ success: true, data: roles[roleIndex] });
    });

    app.delete("/api/admin/roles/:id", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        let roles = db.get("permissions", "roles") || [];
        const roleIndex = roles.findIndex(r => r.id === req.params.id);
        if (roleIndex === -1) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        roles.splice(roleIndex, 1);
        db.set("permissions", "roles", roles);
        res.json({ success: true });
    });

    app.get("/api/admin/users", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        res.json({ success: true, data: perms });
    });

    app.put("/api/admin/users/:id", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const { roles, intents } = req.body;
        if (!roles || !intents) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const userIndex = perms.findIndex(u => u.id === req.params.id);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        perms[userIndex] = {
            ...perms[userIndex],
            roles: Array.isArray(roles) ? roles : [roles],
            intents: Array.isArray(intents) ? intents : [intents]
        };

        db.set("permissions", "users", perms);
        res.json({ success: true, data: perms[userIndex] });
    });
};
