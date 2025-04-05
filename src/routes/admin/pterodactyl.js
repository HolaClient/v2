module.exports = async () => {
    app.get("/api/admin/deploy", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.deploy.view");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());
        try {
            let locations = db.get("pterodactyl", "locations") || [];
            let nodes = db.get("pterodactyl", "nodes") || [];
            let eggs = db.get("pterodactyl", "eggs") || [];
            res.json({ success: true, data: { locations, nodes, eggs } });
        } catch (error) {
            System.err.println(error);
            res.json({ success: false, error: error });
        }
    });

    app.get("/api/admin/pterodactyl/deploy", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.deploy.view");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());
        try {
            let [locations, nodes, nests] = await Promise.all([
                hc.ptl.getMain().locations.getAll().catch(() => []),
                hc.ptl.getMain().nodes.getAll().catch(() => []),
                hc.ptl.getMain().nests.getAll().catch(() => [])
            ]);
            res.json({ success: true, data: { locations, nodes, nests } });
        } catch (error) {
            System.err.println(error);
            res.json({ success: false, error: error });
        }
    });

    app.post("/api/admin/pterodactyl/deploy/locations", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.deploy.modify");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());
        try {
            db.set("pterodactyl", "locations", req.body.locations);
            res.json({ success: true });
        } catch (error) {
            System.err.println(error);
            res.json({ success: false, error: error });
        }
    });

    app.post("/api/admin/pterodactyl/deploy/nodes", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.deploy.modify");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());
        try {
            db.set("pterodactyl", "nodes", req.body.nodes);
            res.json({ success: true });
        } catch (error) {
            System.err.println(error);
            res.json({ success: false, error: error });
        }
    });

    app.post("/api/admin/pterodactyl/deploy/softwares", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.deploy.modify");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());
        try {
            db.set("pterodactyl", "eggs", req.body.softwares);
            res.json({ success: true });
        } catch (error) {
            System.err.println(error);
            res.json({ success: false, error: error });
        }
    });
}