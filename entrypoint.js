// the class that contains task logic to accomplish our goals
const ScheduleWorker = require('./ScheduleWorker');
// instantiate the class
const scheduleWorker = new ScheduleWorker();

// start setting up resources that will persist between serverless invocations
const persistantResourcesReady = scheduleWorker.setupPersistentResources();

module.exports.scheduleFunction = async () => {
  // wait for persist
  await persistantResourcesReady;
  // check if any persistent resources expired between invocations
  await scheduleWorker.refreshResources();
  // set up resources that should only exist during the function invocation
  await scheduleWorker.setupEphemeralResources();
  // complete the scheduled task
  await scheduleWorker.doWork();
  // clean up resources that should only exist during the function invocation
  await scheduleWorker.cleanUpResources();
};
