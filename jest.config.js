module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/sites/csfd'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'sites/csfd/**/*.ts',
    '!sites/csfd/**/*.d.ts',
    '!sites/csfd/test-single-url.ts',
    '!sites/csfd/debug-*.ts',
    '!sites/csfd/csfd.crawler.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/sites/csfd/__tests__/setup.ts'],
  testTimeout: 30000
};