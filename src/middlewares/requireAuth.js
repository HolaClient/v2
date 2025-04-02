module.exports = async function (req, res, next) {
    try {
        if (!req.session.userinfo) return res.redirect("/auth");
        next()
    } catch (error) {
        System.err.println(error)
    }
}