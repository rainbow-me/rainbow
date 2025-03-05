/* eslint-disable @typescript-eslint/no-var-requires */
const { DetoxCircusEnvironment } = require('detox/runners/jest');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);
    this.launchAppTimeout = 120_000;
    this.initTimeout = 120_000;
  }
}
module.exports = CustomDetoxEnvironment;
