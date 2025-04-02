module.exports = async (authHandler) => {
    app.get("/hco/discord", async (req, res) => {
        try {
            const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';
            const params = new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
                response_type: 'code',
                scope: 'identify email',
                prompt: 'consent'
            });

            res.redirect(`${DISCORD_AUTH_URL}?${params.toString()}`);
        } catch (error) {
            console.error('Discord auth error:', error);
            return res.end(JSON.stringify(error));
        }
    });

    app.get("/hco/discord/callback", async (req, res) => {
        try {
            const { code } = req.query;
            
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    code,
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    redirect_uri: process.env.DISCORD_REDIRECT_URI,
                    grant_type: 'authorization_code'
                })
            });

            const tokens = await tokenResponse.json();

            const userInfoResponse = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            });

            const data = await userInfoResponse.json();
            if (data.error) return res.end(JSON.stringify(data));
            if (data.message === '401: Unauthorized') return res.redirect('/hco/discord');
            if (data.verified !== true) return res.send('Please verify your email address in Discord first!');

            let result = await authHandler(db, {
                email: data.email,
                username: data.username,
                nickname: data.global_name,
                avatar: `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}`,
                id: data.id,
                vendor: 'discord'
            }, req, true);

            if (result.success !== true || result.code !== 200) {
                return res.end(JSON.stringify(result));
            }
            res.redirect('/home');
        } catch (error) {
            console.error('Discord callback error:', error);
            return res.end(JSON.stringify(error));
        }
    });
}