module.exports = async () => {
    app.post('/api/admin/settings', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            let status = await hc.modules.HCP.check.request(req, "hc.admin.settings.modify");
            if (status.code !== 200) return res.json(hc.res.internal.forbidden());

            let settings = req.body.settings;
            
            if (!settings || typeof settings !== 'object') {
                return res.json(hc.res.internal.settingsError("Invalid settings data"));
            }
                        
            for (let [key, value] of Object.entries(settings)) {
                hc.settings.set(key, value);
            }
            
            return res.json(hc.res.internal.settingsSaved("Settings updated successfully!"));
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.settingsError("An error occurred while saving settings"));
        }
    });
}