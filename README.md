Scheduling Recurring Code Execution Through Serverless Framework
================================================================

Motivation
----------

Running code on a regular interval is a pretty common task in software development. With such common 
use cases as:

* manual backup of a database
* cleaning up files on a regular interval
* implementing a time to live (TTL) on resources
* polling an API on a regular interval
* re-subscribing to expired event notifications
* sending emails on a regular basis

The first impulse for many developers that need to accomplish such tasks is to start writing 
a script of a language of their choice and then scheduling execution via the commandline tool, 
`cron`. Then, once the script gains uptime requirements, web hosting, daemonization, scaling, and 
continuous deployment all become concerns. These supporting tasks may end up becoming more work 
than coding up the actual work you are trying to get done in the first place.

Fortunately, the big players in cloud computing services have solutions aimed at reducing the
boiler-plate involved in running code in the cloud. These solutions are commonly referred to
as `Serverless`. Serverless is one step beyond traditional PaaS offerings. With Severless your code 
takes minimal time to "spin up" for the first time, only runs when invoked, is typically 
cheaper than persistent servers when those servers are underutilized, autoscales, and requires less 
deployment environment configuration than with most PaaS setups.

As Serverless services are a relatively new avenue of cloud code execution, there is not a widely 
used standard for shaping your serverless project. There is, however, a few frameworks focused on 
abstracting away the differences between Serverless cloud providers. Using one of these frameworks 
helps mitigate vendor lock-in.

Setup
-------

This post will use the [Serverless Framework](https://serverless.com/) to deploy an [AWS Lambda](https://aws.amazon.com/lambda/) function that executes Node.js code on a schedule.

Make sure you [install Node.js](https://nodejs.org/en/download/package-manager/) and set up [AWS credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/) for your development environment. Commands in this tutorial will use the [npx commandline utility](https://www.npmjs.com/package/npx) which was introduced with `npm` version 5.2.0.

Code
-----

Feel free to download and modify the [git hub project](https://github.com/minervas/scheduled-serverless-fn) for this tutorial.

All serverless framework projects start with a simple `serverless.yml` file that contains basic 
configuration for your project.

```YAML
# name your project here
service: scheduled-serverless-fn

# config relavent to the cloud provider that will run your serverless function
provider:
  # we will use AWS for this tutorial, but check out the list of all supported providers here:
  # https://serverless.com/framework/docs/providers/
  name: aws
  # this example is coded in node.js but check out all the supported aws lambda runtimes here:
  # https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
  runtime: nodejs8.10

# config for all the functions that make up your service
functions:
  # the name of your function
  scheduleFunction:
    # {{path to the script containing the entrypoint of your function}}.{{the entrypoint function name}}
    handler: entrypoint.scheduleFunction
    # config for what sort of events trigger your function
    events:
      # invoke our function on the first minute of every even 15 minute interval
      # check out
      # https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
      # for AWS cron syntax
      - schedule: cron(0/15 * * * ? *)
```

After creating this configuration you'll want to create the entry point of your function, I named 
mine `entrypoint.js`. Note, exported `scheduleFunction` whose name matches the handler function 
name in our `serverless.yml`

```javascript
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
```

Here is the ScheduleWorker class, with logging in every method to demonstrate that the method is called and in what order:

```javascript
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
```

If you have downloaded the github project for this tutorial you will want to run `npm install` to 
install dependencies. Otherwise, at a minimum you will need to setup the serverless npm package as a dev-dependency by running `npm install serverless --save-dev`. In the github project I have setup 
linting and testing boiler plate by way of [eslint](https://eslint.org/) and [jest](https://jestjs.io/). I won't go into the intricacies of 
these setups, but you should be able to verify that files in the repo pass linting and test 
requirements by executing `npm run lint` and `npm run test`. You can test running our function 
locally through the serverless npm package by executing `npx sls invoke local -f scheduleFunction`.
This should produce the following output:

```
ScheduleWorker constructor called
ScheduleWorker setupPersistentResources called
ScheduleWorker refreshResources called
ScheduleWorker setupEphemeralResources called
ScheduleWorker doWork called
ScheduleWorker cleanUpResources called
```

Now we are ready to deploy our function, which can be done with `npx sls deploy`, which will print 
something similar to:

```
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Creating Stack...
Serverless: Checking Stack create progress...
.....
Serverless: Stack create finished...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service scheduled-serverless-fn.zip file to S3 (84.61 KB)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
.....................
Serverless: Stack update finished...
Service Information
service: scheduled-serverless-fn
stage: dev
region: us-east-1
stack: scheduled-serverless-fn-dev
resources: 7
api keys:
  None
endpoints:
  None
functions:
  scheduleFunction: scheduled-serverless-fn-dev-scheduleFunction
layers:
  None
```

We can see the logs of our function execution in AWS by `npx sls logs -f "scheduleFunction"`. 
However, if you execute this command before the first scheduled invocation of your function (as 
dictated by our cron expression on our `serverless.yml` file) you will get the error: 
`No existing streams for the function`. This is because AWS waits for the function to invoke once 
before creating the CloudWatch log streams that your function logs will be available on.

Finally, once you are done with your function you can delete all AWS resources allocated for the 
service you specified in your `serverless.yml` file by executing `npx sls remove`