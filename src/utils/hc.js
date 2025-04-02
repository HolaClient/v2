const requireAuth = require("../middlewares/requireAuth");
const modules = require("./modules");
const settings = require("./settings");

module.exports = {
    modules,
    res: require("./response"),
    secrets: modules.HCU.secrets,
    settings,
    config: settings,
    ptl: require("../lib"),
    wares: {
        requireAuth
    },
    loadModule: (a, c) => {
        const b = path.resolve(a);
        delete require.cache[require.resolve(b)];
        if (c) return require(b)(c);
        return require(b);
    },
    loadModuleAsync: async (a, c) => {
        const b = path.resolve(a);
        delete require.cache[require.resolve(b)];
        if (c) return await require(b)(c);
        return await require(b);
    }
}