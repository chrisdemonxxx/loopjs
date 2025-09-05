require('dotenv').config();
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const Task = require('./models/Task');

const MONGO_URI = process.env.MONGO_URI;
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
};

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Worker connected to MongoDB'))
  .catch(err => console.error('Worker MongoDB connection error:', err));

const worker = new Worker('commandQueue', async (job) => {
  const { uuid, command } = job.data;
  console.log(`Processing job ${job.id} for client ${uuid}`);

  const task = new Task({
    uuid,
    command,
    status: 'processing',
    jobId: job.id,
  });
  await task.save();

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command for job ${job.id}:`, error);
      task.status = 'failed';
      task.output = stderr;
      await task.save();
      return;
    }

    task.status = 'completed';
    task.output = stdout;
    await task.save();
    console.log(`Job ${job.id} completed successfully.`);
  });
}, { connection: redisConnection });

console.log('Worker listening for jobs...');

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});
