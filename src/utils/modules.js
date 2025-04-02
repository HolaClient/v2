const getAllSettings = require('../lib/core/getAllSettings.js');

/**
 *--------------------------------------------------------------------------
 * Loading modules
 *--------------------------------------------------------------------------
*/
global.os = require('os');
global.crypto = require('crypto');
global.path = require('path');
global.fs = require('fs');
global.chalk = require("../modules/HCU/colors");
global.hc = require('./hc.js');
global.app = require('../modules/HCW')();
global.cache = require('../modules/HCU/cache.js');
global.System = { out: { println: console.log, flush: console.clear }, err: { println: console.error } };
module.exports = {
    HCF: require('../modules/HCF'),
    HCU: require('../modules/HCU'),
    HCP: require('../modules/HCP'),
    getAllSettings
}
/**
 *--------------------------------------------------------------------------
 * End of the file
 *--------------------------------------------------------------------------
*/