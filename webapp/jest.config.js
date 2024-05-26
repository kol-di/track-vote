module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.js'], 
    moduleNameMapper: {
      '^socket.io-client$': '<rootDir>/src/tests/__mocks__/socket.io-client.js', 
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '^@/(.*)$': '<rootDir>/$1'
    },
    transform: {
      '^.+\\.(js|jsx)?$': ['babel-jest', { configFile: './babel.config.jest.js' }],
    },
    reporters: [
      "default",
      ["jest-junit", {
        outputDirectory: "test-results",
        outputName: "results.xml"
      }]
    ]
  };
  