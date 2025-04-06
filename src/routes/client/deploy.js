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
            let data = req.body.server;
            
            let locations = db.get("pterodactyl", "locations") || [];
            let nodes = db.get("pterodactyl", "nodes") || [];
            let eggs = db.get("pterodactyl", "eggs") || [];

            data.node = parseInt(data.node);
            data.location = parseInt(data.location);
            data.software = parseInt(data.software);
            data.description = data.description || "";

            let validateData = hc.modules.HCU.validate([
                {
                    "pointer": "name",
                    "required": true,
                    "type": "string",
                    "format": "username",
                    "min": 2,
                    "max": 20,
                    "rejectPattern": "(!!!)"
                },
                {
                    "pointer": "location",
                    "required": true,
                    "type": "number",
                    "min": 1,
                    "max": 999999999999999
                },
                {
                    "pointer": "node",
                    "required": true,
                    "type": "number",
                    "min": 1,
                    "max": 999999999999999
                },
                {
                    "pointer": "software",
                    "required": true,
                    "type": "number",
                    "min": 1,
                    "max": 999999999999999
                },
                {
                    "pointer": "description",
                    "required": false,
                    "type": "string",
                    "min": 0,
                    "max": 100
                }
            ], data);

            if (!validateData.success) return res.json({ success: false, error: validateData.error });
            if (!locations.some(location => parseInt(location.id) === data.location)) return res.json({ success: false, error: "Location not found!" });
            if (!nodes.some(node => parseInt(node.id) === data.node)) return res.json({ success: false, error: "Node not found!" });
            if (!eggs.some(egg => parseInt(egg.id )=== data.software)) return res.json({ success: false, error: "Software not found!" });

            let validateResources = hc.modules.HCU.validate([
                {
                    "pointer": "cpu",
                    "required": true,
                    "type": "number",
                    "min": 0.25,
                    "max": 128
                },
                {
                    "pointer": "memory",
                    "required": true,
                    "type": "number",
                    "min": 128,
                    "max": 512000
                },
                {
                    "pointer": "disk",
                    "required": true,
                    "type": "number",
                    "min": 512,
                    "max": 512000
                }
            ], data.resources);
            if (!validateResources.success) return res.json({ success: false, error: validateResources.error });

            let resources = db.get("resources", req.session.userinfo.email) || {};
            for ([key, value] of Object.entries(data.resources)) {
                if (resources[key] < value) return res.json({ success: false, error: `Not enough ${key} resources!` });
                resources[key] -= value;
            }
            db.set("resources", req.session.userinfo.email, resources);

            let economy = db.get("economy", req.session.userinfo.email) || {};
            let price = 0;

            let curLoc =  locations.find(location => parseInt(location.id) === data.location);
            let curNode = nodes.find(node => parseInt(node.id) === data.node);
            let curEgg = eggs.find(egg => parseInt(egg.id) === data.software);

            price += curLoc.fee ?? 0;
            price += curNode.fee ?? 0;
            price += curEgg.fee ?? 0;
            
            if (economy.coins < price) return res.json({ success: false, error: "Not enough balance!" });
            
            economy.coins -= price;
            db.set("economy", req.session.userinfo.email, economy);

            let node = await hc.ptl.getMain().nodes.get(data.node);
            if (!node) return res.json({ success: false, error: "Node has been removed!" });
            let egg = await hc.ptl.getMain().eggs.get(data.software);
            if (!egg) return res.json({ success: false, error: "Software has been removed!" });
            let location = await hc.ptl.getMain().locations.get(data.location);
            if (!location) return res.json({ success: false, error: "Location has been removed!" });

            let users = db.get("pterodactyl", "users") || [];
            let user = users.find(user => user.email === req.session.userinfo.email);

            let environment = {};
            if (egg.attributes.relationships.variables.data) {
                for (let i of egg.attributes.relationships.variables.data) {
                    environment[i.attributes.env_variable] = i.attributes.default_value;
                }
            }

            let allocation;
            for (let i of node.attributes.relationships.allocations.data) {
                if (i.attributes.assigned === false) {
                    allocation = i.attributes.id;
                    break;
                }
            }

            let server = {
                "name": data.name,
                "user": user.id,
                "egg": data.software,
                "docker_image": egg.attributes.docker_image,
                "startup": egg.attributes.startup,
                "environment": environment,
                "limits": {
                    "memory": data.resources.memory,
                    "swap": -1,
                    "disk": data.resources.disk,
                    "cpu": data.resources.cpu / 100,
                    "io": 500
                },
                "feature_limits": {
                    "databases": data.resources.databases || 0,
                    "allocations": data.resources.allocations || 0,
                    "backups": data.resources.backups || 0,
                },
                "allocation": {
                    "default": allocation
                },
            };

            let result = await hc.ptl.getMain().servers.create(server);
            if (!result) return res.json({ success: false, error: "Failed to create server. " + result });

            if (result.data.errors) {
                let errors = result.data.errors.map(error => error.detail).join(", ");
                return res.json({ success: false, error: errors });
            }

            if (result.data.attributes) {
                let servers = db.get("pterodactyl", "servers") || [];
                servers.push(result.data.attributes);
                db.set("pterodactyl", "servers", servers);
            }
            
            return res.json({ success: true, data: result.data.attributes });
        } catch (error) {
            System.err.println(error);
            res.json({ success: false, error: error }); 
        }
    });
}