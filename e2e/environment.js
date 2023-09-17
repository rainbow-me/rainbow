const { DetoxCircusEnvironment } = require('detox/runners/jest');
const {
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest/testEnvironment/listeners');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 300000;

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    // This is strictly optional.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

// eslint-disable-next-line import/no-commonjs
module.exports = CustomDetoxEnvironment;
