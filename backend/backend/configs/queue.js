const { Queue } = require('bullmq');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
};

const commandQueue = new Queue('commandQueue', {
  connection: redisConnection,
});

module.exports = commandQueue;
