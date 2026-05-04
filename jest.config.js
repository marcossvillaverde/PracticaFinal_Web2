export default {
  testEnvironment: 'node',
  transform:       {},
  testMatch:       ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  globals: {
    jest: true,
  },
};