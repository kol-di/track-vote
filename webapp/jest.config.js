module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.js'], 
    transform: {
      '^.+\\.jsx?$': 'babel-jest',
    },
  };
  