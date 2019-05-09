
const entrypoint = require('../entrypoint');

const MockScheduleWorkerClass = require('../ScheduleWorker');

// mock the underlying ScheduleWorker class that entrypoint uses
jest.mock('../ScheduleWorker');

describe('entrypoint', () => {
  test('should complete the scheduled task when called', async () => {
    // invoke our function
    await entrypoint.scheduleFunction();
    // assert that the ScheduleWorker constructor was called
    expect(MockScheduleWorkerClass).toHaveBeenCalledTimes(1);

    // get a handle to the instance of the ScheduleWorker class that entrypoint used
    const mockScheduleWorker = MockScheduleWorkerClass.mock.instances[0];
    // get the names of all the methods on the scheduleWorker instance
    const scheduleWorkerMethods = Object.keys(mockScheduleWorker);
    scheduleWorkerMethods.forEach((scheduleWorkerMethod) => {
      // assert that every method on the scheduleWorker instance was called
      expect(mockScheduleWorker[scheduleWorkerMethod]).toHaveBeenCalledTimes(1);
    });
  });
});
