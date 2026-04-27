// Configuración de Jest para ESM
// Usamos mongodb-memory-server para no tocar la BD real en los tests
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
};