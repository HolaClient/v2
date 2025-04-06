module.exports = async () => {
    app.post('/api/economy/links/linkpays', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            
            return res.json(hc.res.internal.success("Settings updated successfully!"));
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error(error));
        }
    });
}