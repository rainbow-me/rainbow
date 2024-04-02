/* eslint-disable @typescript-eslint/no-var-requires */
const { DetoxCircusEnvironment } = require('detox/runners/jest');
const { SpecReporter, WorkerAssignReporter } = require('detox/runners/jest/testEnvironment/listeners');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);
    this.launchAppTimeout = 120_000;
    this.initTimeout = 360_000;
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}
module.exports = CustomDetoxEnvironment;
