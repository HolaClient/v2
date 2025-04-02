module.exports = async () => {
    app.get("/logout", async (req, res) => {
        try {
            app.sessions.delete(req.session.session.identifier);
            res.redirect('/');
        } catch (error) {
            console.error('Logout error:', error);
            return res.end(error);
        }
    });
}