var fs = require("fs");
var util = require('util');
var config = require('./config.js');
var logger = require('./logger').logger;
var uuidV4 = require('uuid/v4');
var moment = require('moment');

exports.write = function(job, messages, callback) {
    if (messages.length > 0) {
        job.progress(20);
        var uuid = uuidV4();
        var cur_date = moment().format('YYMMDDHHmmss');
        var tmp_filename = util.format("%s_CDRg/DLR_%s_%s", config.writer.db_dlr_files, cur_date, uuid);
        var dlr_filename = util.format("%s/DLR_%s_%s", config.writer.db_dlr_files, cur_date, uuid);

        var options = {
            flags: 'a',
            defaultEncoding: 'utf8',
            mode: 0666
        };
        job.progress(30);
        logger.debug("write to : " + tmp_filename);
        var stream = fs.createWriteStream(tmp_filename, options);
        job.progress(60);
        stream.on('error', callback);
        stream.write('FFFE', 'hex');
        stream.write(messages, 'utf16le');
        job.progress(70);
        stream.end(function() {
            job.progress(80);
            logger.debug("move to : " + dlr_filename);
            exports.move(tmp_filename, dlr_filename, callback);
        });

    } else {
        callback();
    }
};

exports.move = function(sourcePath, targetPath, callback) {
    var readStream = fs.createReadStream(sourcePath);
    var writeStream = fs.createWriteStream(targetPath);
    readStream.on('error', callback);
    writeStream.on('error', callback);
    readStream.on('close', function() {
        fs.unlink(sourcePath, callback);
    });
    readStream.pipe(writeStream);
};