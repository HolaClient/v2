module.exports = async () => {
    app.get("/api/admin/pterodactyl/locations", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.locations.view");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());

        try {
            let locations = await hc.ptl.getMain().locations.getAll() || [];
            res.json({ success: true, data: locations });
        } catch (error) {
            console.error("Failed to fetch Pterodactyl locations:", error);
            res.json({ success: false, error: "Failed to fetch Pterodactyl locations" });
        }
    });

    app.get("/api/admin/pterodactyl/config/locations", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.locations.view");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());

        try {
            let configuredLocations = db.get("pterodactyl.locations") || [];
            res.json({ success: true, data: configuredLocations });
        } catch (error) {
            console.error("Failed to fetch configured locations:", error);
            res.json({ success: false, error: "Failed to fetch configured locations" });
        }
    });

    app.get("/api/admin/pterodactyl/nodes", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.nodes.view");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());

        try {
            let nodes = await hc.ptl.getMain().nodes.getAll() || [];
            res.json({ success: true, data: nodes });
        } catch (error) {
            console.error("Failed to fetch Pterodactyl nodes:", error);
            res.json({ success: false, error: "Failed to fetch Pterodactyl nodes" });
        }
    });

    app.get("/api/admin/pterodactyl/nests", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.eggs.view");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());

        try {
            const nests = await hc.ptl.getMain().nests.getAll() || [];
            res.json({ success: true, data: nests });
        } catch (error) {
            console.error("Failed to fetch Pterodactyl nests:", error);
            res.json({ success: false, error: "Failed to fetch Pterodactyl nests" });
        }
    });

    app.get("/api/admin/pterodactyl/config", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.config.view");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());

        try {
            const config = db.get("pterodactyl") || { 
                locations: [], 
                nodes: [], 
                softwares: [] 
            };
            
            res.json({ success: true, config });
        } catch (error) {
            console.error("Failed to fetch Pterodactyl configuration:", error);
            res.json({ success: false, error: "Failed to fetch configuration" });
        }
    });

    app.post("/api/admin/pterodactyl/save", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let status = await hc.modules.HCP.check.request(req, "hc.admin.pterodactyl.config.edit");
        if (status.code !== 200) return res.json(hc.res.internal.forbidden());

        try {
            const { locations, nodes, softwares } = req.body;

            db.set("pterodactyl", {
                locations: locations || [],
                nodes: nodes || [],
                softwares: softwares || []
            });

            res.json({ success: true });
        } catch (error) {
            console.error("Failed to save Pterodactyl configuration:", error);
            res.json({ success: false, error: "Failed to save configuration" });
        }
    });
}