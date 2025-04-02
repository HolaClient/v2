module.exports = async (authHandler) => {
    app.get("/hco/google", async (req, res) => {
        try {
            const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
            const params = new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                access_type: 'offline',
                prompt: 'consent'
            });

            res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
        } catch (error) {
            console.error('Google auth error:', error);
            return res.end(JSON.stringify(error));
        }
    });

    app.get("/hco/google/callback", async (req, res) => {
        try {
            const { code } = req.query;
            
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                    grant_type: 'authorization_code'
                })
            });

            const tokens = await tokenResponse.json();

            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            });

            const data = await userInfoResponse.json();
            if (data.error) return res.end(JSON.stringify(data));

            let name = data.name || data.email.split('@')[0] || data.given_name || "Anonymous";
            let result = await authHandler(db, {
                email: data.email || data.sub,
                username: name.replace(/[^a-zA-Z0-9]/g, ''),
                nickname: name,
                avatar: data.picture,
                id: data.id,
                vendor: 'google'
            }, req, true);

            if (result.success !== true || result.code !== 200) {
                return res.end(JSON.stringify(result));
            }
            res.redirect('/home');
        } catch (error) {
            console.error('Google callback error:', error);
            return res.end(JSON.stringify(error));
        }
    });
}