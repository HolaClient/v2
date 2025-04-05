module.exports = async () => {
    app.get("/api/client/deploy", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.deploy.view");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());
        try {
            let locations = db.get("pterodactyl", "locations") || [];
            let nodes = db.get("pterodactyl", "nodes") || [];
            let eggs = db.get("pterodactyl", "eggs") || [];
            let resources = db.get("resources", req.session.userinfo.email) || {};
            res.json({ success: true, data: { locations, nodes, eggs, resources } });
        } catch (error) {
            System.err.println(error);
            res.json({ success: false, error: error });
        }
    });

    app.post("/api/client/deploy", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.deploy.create");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());
        try {
            let result = await hc.ptl.getMain().servers.create(req.body.server).catch(() => false);
            if (!result) return res.json({ success: false, error: "Failed to create server." });
            
            return res.json({ success: true, data: result });
        } catch (error) {
            System.err.println(error);
            res.json({ success: false, error: error }); 
        }
    });
}