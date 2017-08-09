var log4js = require("log4js");
var config = require('./config');

function getLogger() {
    var log = config.log;
    log4js.configure(log);
    var logger = log4js.getLogger(log.appenders[1].category);
    logger.setLevel(log.Level);
    return logger;
}

module.exports.logger = getLogger();