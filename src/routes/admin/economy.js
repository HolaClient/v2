module.exports = async () => {
    app.post('/api/admin/economy/settings', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            let status = await hc.modules.HCP.check.request(req, "hc.admin.economy.modify");
            if (status.code !== 200) return res.json(hc.res.internal.forbidden());

            let settings = req.body;
            
            if (!settings || typeof settings !== 'object') {
                return res.json(hc.res.internal.error("Invalid settings data"));
            }
            
            for (let [key, value] of Object.entries(settings)) {
                if (key.startsWith('economy.')) {
                    hc.settings.set(key, value);
                }
            }
            
            return res.json(hc.res.internal.success("Economy settings updated successfully!"));
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("An error occurred while saving economy settings"));
        }
    });

    app.get('/api/admin/economy/j4r-servers', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            let status = await hc.modules.HCP.check.request(req, "hc.admin.economy.view");
            if (status.code !== 200) return res.json(hc.res.internal.forbidden());

            let servers = db.get('economy',' j4r_servers');
            
            return res.json({
                success: true,
                servers: servers || []
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to fetch J4R servers"));
        }
    });

    app.post('/api/admin/economy/j4r-servers', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            let status = await hc.modules.HCP.check.request(req, "hc.admin.economy.modify");
            if (status.code !== 200) return res.json(hc.res.internal.forbidden());

            const { name, serverId, inviteCode, coinsReward } = req.body;
            
            if (!name || !serverId || !inviteCode || !coinsReward) {
                return res.json(hc.res.internal.error("Missing required fields"));
            }

            const server = {
                id: hc.modules.uuid(),
                name,
                serverId,
                inviteCode,
                coinsReward: parseInt(coinsReward),
                createdAt: Date.now()
            };
            
            let servers = db.get("economy", "j4r_servers") || [];
            servers.push(server)
            db.set('economy', 'j4r_servers', servers);
            
            return res.json({
                success: true,
                serverId: server.id,
                message: "Server added successfully"
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to add J4R server"));
        }
    });

    app.put('/api/admin/economy/j4r-servers/:id', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            let status = await hc.modules.HCP.check.request(req, "hc.admin.economy.modify");
            if (status.code !== 200) return res.json(hc.res.internal.forbidden());

            const { id } = req.params;
            const { name, serverId, inviteCode, coinsReward } = req.body;
            
            if (!name || !serverId || !inviteCode || !coinsReward) {
                return res.json(hc.res.internal.error("Missing required fields"));
            }

            const servers = db.get('economy', 'j4r_servers');
            let existingServer = servers.find(i => i.id == id)
            
            if (!existingServer) {
                return res.json(hc.res.internal.error("Server not found"));
            }
            
            const updatedServer = {
                ...existingServer,
                name,
                serverId,
                inviteCode,
                coinsReward: parseInt(coinsReward),
                updatedAt: Date.now()
            };
            existingServer = updatedServer
            
            db.set('economy', 'j4r_servers', servers);
            
            return res.json({
                success: true,
                message: "Server updated successfully"
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to update J4R server"));
        }
    });

    app.delete('/api/admin/economy/j4r-servers/:id', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            let status = await hc.modules.HCP.check.request(req, "hc.admin.economy.modify");
            if (status.code !== 200) return res.json(hc.res.internal.forbidden());

            const { id } = req.params;
            
            let servers = db.get("economy", "j4r_servers") || []
            servers = servers.filter(i => i.id !== id);
            db.set("economy", "j4r_servers", servers)
            
            return res.json({
                success: true,
                message: "Server deleted successfully"
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to delete J4R server"));
        }
    });
}
