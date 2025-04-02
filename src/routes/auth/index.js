module.exports = () => {
    const handler = require("../../modules/HCO/index.js");
    handler.providers.discord(handler);
    handler.providers.google(handler);
    handler.providers.logout();
}