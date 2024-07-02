const Environment = require('jest-environment-jsdom').default;
const { TextEncoder, TextDecoder } = require('util');

class CustomTestEnvironment extends Environment {
  async setup() {
    await super.setup();
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
  }
}

module.exports = CustomTestEnvironment;
