module.exports = function (req) {
    let a = req?.session?.userinfo?.locale || req?.session?.locale || "en"
    let b = path.resolve(`./resources/locales/${a}/index.js`)
    if (!fs.existsSync(b)) {
        b = path.resolve('./resources/locales/en/index.js')
    }
    c = JSON.parse(fs.readFileSync(b));
    return c;
}