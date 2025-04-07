module.exports = async () => {
    const economyUtils = require('../../utils/economy');

    app.get('/api/economy/j4r-servers', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            
            const economyEnabled = hc.settings.raw('economy.general.enabled');
            if (!economyEnabled) {
                return res.json({
                    success: false,
                    error: "Economy system is disabled"
                });
            }

            const j4rEnabled = hc.settings.raw('economy.j4r.enabled');
            if (!j4rEnabled) {
                return res.json({
                    success: false,
                    error: "J4R feature is disabled"
                });
            }
            
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

    app.post('/api/auth/login', async (req, res, next) => {
        try {
            const originalHandler = res.json;
            
            res.json = function(data) {
                if (data.success && data.user && req.session.userinfo) {
                    const economyEnabled = hc.settings.raw('economy.general.enabled');
                    const j4rEnabled = hc.settings.raw('economy.j4r.enabled');
                    
                    if (economyEnabled && j4rEnabled) {
                        checkUserDiscordServers(req.session.userinfo.id, req.session.userinfo.discord?.id);
                    }
                }
                
                return originalHandler.call(this, data);
            };
            
            next();
        } catch (error) {
            System.err.println(error);
            next();
        }
    });

    app.post('/api/auth/register', async (req, res, next) => {
        try {
            const originalHandler = res.json;
            
            res.json = function(data) {
                if (data.success && data.user && req.session.userinfo) {
                    const economyEnabled = hc.settings.raw('economy.general.enabled');
                    const j4rEnabled = hc.settings.raw('economy.j4r.enabled');
                    
                    if (economyEnabled && j4rEnabled) {
                        checkUserDiscordServers(req.session.userinfo.id, req.session.userinfo.discord?.id);
                    }
                }
                
                return originalHandler.call(this, data);
            };
            
            next();
        } catch (error) {
            System.err.println(error);
            next();
        }
    });

    async function checkUserDiscordServers(userId, discordId) {
        if (!userId || !discordId) return;
        
        try {
            const servers = db.get('economy',' j4r_servers');
            if (!servers || servers.length === 0) return;
            
            const userServersProcessed = db.get('j4r_processed', userId) || { servers: [] };
            
            for (const server of servers) {
                if (userServersProcessed.servers.includes(server.id)) continue;
                
                const isInServer = await checkIfUserInDiscordServer(discordId, server.serverId);
                
                if (isInServer) {
                    await economyUtils.addTransaction(
                        userId,
                        parseInt(server.coinsReward),
                        `Joined Discord server: ${server.name}`
                    );
                    
                    userServersProcessed.servers.push(server.id);
                }
            }
            
            db.set('j4r_processed', userId, userServersProcessed);
        } catch (error) {
            System.err.println("Error checking user Discord servers:", error);
        }
    }

    async function checkIfUserInDiscordServer(discordId, serverId) {
        try {
            const discordBotToken = hc.settings.raw('discord.bot.token');
            if (!discordBotToken) return false;
            
            const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}/members/${discordId}`, {
                headers: {
                    Authorization: `Bot ${discordBotToken}`
                }
            });
            
            return response.status === 200;
        } catch (error) {
            System.err.println("Error checking Discord server membership:", error);
            return false;
        }
    }
}
