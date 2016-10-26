'use strict';

let redisConfig;

redisConfig = {};

const queue = require('kue-scheduler').createQueue(redisConfig);
const job = queue.create();

queue.watchStuckJobs(6000);

queue.every( '2 minutes from now', job )

queue.on('ready', () => {
  console.info('Queue is ready!');
});

queue.on('error', (err) => {
  console.error('There was an error in the main queue!');
  console.error(err);
  console.error(err.stack);
});

queue.process('emailSender', (job, done) => {
  const data = job.data;
  var date = new Date();
  console.log('call emailSender job at ' + date);
});

function createQueue(data, done) {
  return queue.create('emailSender', data)
    .priority('critical')
    .attempts(3)
    .backoff(true)
    .removeOnComplete(false)
    .save((err) => {
      if (err) {
        console.error(err);
        done(err);
      }
      if (!err) {
        done();
      }
    });
}

module.exports = {
  create: (data, done) => {
    createQueue(data, done);
  }
};
