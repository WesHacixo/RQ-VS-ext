module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['<rootDir>/__tests__/unit/mcp/**/*.test.ts'],
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['src/mcp/**/*.{ts,js}'],
};
