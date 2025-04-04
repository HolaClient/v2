module.exports = async () => {
    app.get("/api/admin/users", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users") || [];
        let user = perms.find(i => i.email == req.session.userinfo?.email);
        if (!user || !user.roles?.includes("admin") && !user.roles?.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        let users = db.get("users", "users") || [];
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filter = req.query.filter || "";
        
        let filteredUsers = users;
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredUsers = users.filter(user => 
                user.name?.toLowerCase().includes(searchTerm) || 
                user.email?.toLowerCase().includes(searchTerm)
            );
        }
        
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        res.json({ 
            success: true, 
            users: paginatedUsers.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt || new Date().toISOString(),
                status: user.status || "active"
            })),
            total: filteredUsers.length
        });
    });

    app.get("/api/admin/users/:id", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        let users = db.get("users", "users") || [];
        const userId = req.params.id;
        const foundUser = users.find(u => u.id == userId);
        
        if (!foundUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        res.json({ 
            success: true, 
            user: {
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                createdAt: foundUser.createdAt || new Date().toISOString(),
                status: foundUser.status || "active"
            }
        });
    });

    app.post("/api/admin/users", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let users = db.get("users", "users") || [];
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }

        const crypto = require('crypto');
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        const newUser = {
            id: Math.random().toString().slice(2, 10),
            name,
            email,
            password: {
                hash,
                salt
            },
            createdAt: new Date().toISOString(),
            status: "active"
        };

        users.push(newUser);
        db.set("users", "users", users);

        if (role && (role === "admin" || role === "user")) {
            let permUsers = db.get("permissions", "users") || [];
            const newPermUser = {
                id: newUser.id,
                email: newUser.email,
                roles: [role],
                intents: role === "admin" ? ["admin"] : []
            };
            permUsers.push(newPermUser);
            db.set("permissions", "users", permUsers);
        }

        res.json({ 
            success: true, 
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt,
                status: newUser.status
            }
        });
    });

    app.put("/api/admin/users/:id", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const userId = req.params.id;
        const { name, email, status } = req.body;
        
        if (!name && !email && !status) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        let users = db.get("users", "users") || [];
        const userIndex = users.findIndex(u => u.id == userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (email && email !== users[userIndex].email) {
            const emailExists = users.some(u => u.id !== userId && u.email.toLowerCase() === email.toLowerCase());
            if (emailExists) {
                return res.status(400).json({ success: false, message: "Email already in use" });
            }
            users[userIndex].email = email;
            
            let permUsers = db.get("permissions", "users") || [];
            const permUserIndex = permUsers.findIndex(u => u.id == userId);
            if (permUserIndex !== -1) {
                permUsers[permUserIndex].email = email;
                db.set("permissions", "users", permUsers);
            }
        }

        if (name) users[userIndex].name = name;
        if (status) users[userIndex].status = status;

        db.set("users", "users", users);

        res.json({ 
            success: true, 
            user: {
                id: users[userIndex].id,
                name: users[userIndex].name,
                email: users[userIndex].email,
                createdAt: users[userIndex].createdAt,
                status: users[userIndex].status
            }
        });
    });

    app.delete("/api/admin/users/:id", async (req, res) => {
        if (!req.session.userinfo) return res.redirect("/auth");
        let perms = db.get("permissions", "users");
        let user = perms.find(i => i.email == req.session.userinfo.email);
        if (!user || !user.roles.includes("admin") && !user.roles.includes("owner")) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const userId = req.params.id;
        
        if (user.id == userId) {
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }

        let users = db.get("users", "users") || [];
        const userIndex = users.findIndex(u => u.id == userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        users.splice(userIndex, 1);
        db.set("users", "users", users);

        let permUsers = db.get("permissions", "users") || [];
        const permUserIndex = permUsers.findIndex(u => u.id == userId);
        if (permUserIndex !== -1) {
            permUsers.splice(permUserIndex, 1);
            db.set("permissions", "users", permUsers);
        }

        res.json({ success: true });
    });

    app.get("/api/search", async (req, res) => {
        const query = req.query.q || "";
        if (!query || query.length < 2) {
            return res.json({ results: [] });
        }

        // Basic search implementation
        const searchTerm = query.toLowerCase();
        const results = [];

        // Search users if user is admin
        if (req.session.userinfo) {
            let perms = db.get("permissions", "users");
            let user = perms.find(i => i.email == req.session.userinfo.email);
            if (user && (user.roles.includes("admin") || user.roles.includes("owner"))) {
                let users = db.get("users", "users") || [];
                const matchingUsers = users.filter(u => 
                    u.name?.toLowerCase().includes(searchTerm) || 
                    u.email?.toLowerCase().includes(searchTerm)
                ).slice(0, 5);
                
                matchingUsers.forEach(u => {
                    results.push({
                        title: u.name,
                        description: `User - ${u.email}`,
                        url: `/admin/users?highlight=${u.id}`
                    });
                });
            }
        }

        res.json({ results });
    });
};