
// class that contains the logic necessary to accomplish our scheduled task
const ScheduleWorker = class {
  constructor() {
    console.log('ScheduleWorker constructor called');
  }

  async setupPersistentResources() {
    console.log('ScheduleWorker setupPersistentResources called');
  }

  async refreshResources() {
    console.log('ScheduleWorker refreshResources called');
  }

  async setupEphemeralResources() {
    console.log('ScheduleWorker setupEphemeralResources called');
  }

  async doWork() {
    console.log('ScheduleWorker doWork called');
  }

  async cleanUpResources() {
    console.log('ScheduleWorker cleanUpResources called');
  }
};

module.exports = ScheduleWorker;
