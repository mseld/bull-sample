var Promise = require("bluebird");
var Queue = require('bull');
var cluster = require('cluster');
var logger = require('./logger').logger;
var config = require('./config.js');
var fileWriter = require('./fileWriter');

var queue = Queue('fileWriterQueue',
    config.redis.port,
    config.redis.host, {
        db: config.redis.index || 0
    });

queue.on('error', function(error) {
    // Error
    console.log("error event has error:" + error);
});

queue.on('ready', function() {
    console.log("queue is ready.");
    queue.getJobCounts().then(function(data) {
        console.log('Queue Job Counts : ' + JSON.stringify(data, null, 2));
    });
});

queue.on('active', function(job, jobPromise) {
    // Job started
    // You can use jobPromise.cancel() to abort this job.
    console.log("job active id: " + job.jobId);
});

queue.on('stalled', function(job) {
    // A job has been marked as stalled. This is useful for debugging job
    // workers that crash or pause the event loop.
    console.log("job stalled id: " + job.jobId);
});

queue.on('progress', function(job, progress) {
    // A job's progress was updated!
    console.log('job id:' + job.id + ' progress:' + progress);
});

queue.on('paused', function() {
    // The queue has been paused.
    console.log('queue active');
});

queue.on('resumed', function(job) {
    // The queue has been resumed.
    console.log("job resumed id: " + job.jobId);
});

queue.on('cleaned', function(jobs, type) {
    // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
    // jobs, and `type` is the type of jobs cleaned.
    console.log("job cleaned id: " + job.jobId);
});

queue.on('completed', function(job, result) {
    // Job completed with output result!
    console.log("job completed id: " + job.jobId);
});

queue.on('failed', function(job, err) {
    // Job failed with reason err!
    console.log("job failed id: " + job.jobId + " with err?:" + err);
    //queue.retryJob(job);
    job.retry();
});

queue.process(function(job, done) {
    // job.jobId contains id of this job.
    // job.data contains the custom data passed when the job was created
    logger.debug('Queue job id : ' + job.jobId + ' is Started');
    //report progress
    job.progress(01);
    fileWriter.write(job, job.data.messages, function(err) {
        if (err) {
            logger.debug('Queue job id error: ' + job.jobId);
            job.progress(100);
            done(Error(err));
        } else {
            logger.debug('Queue job id : ' + job.jobId + ' is Completed');
            job.progress(100);
            done();
        }
    });
});

// every 5 seconds retry on failed jobs
setInterval(function() {
    queue.getFailed().then(function(jobs) {
        return Promise.each(jobs, function(job) {
            job.retry();
        });
    });
}, 5000);

// every 2 seconds print the stats
setInterval(function() {
    queue.getJobCounts().then(function(data) {
        console.log('Queue Job Counts : ' + JSON.stringify(data, null, 2));
    });
}, 30000);

exports.add = function(obj) {
    queue.add({ messages: obj });
};

setImmediate(function(param) {}, )