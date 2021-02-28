module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.spec.ts'
  ],
  coveragePathIgnorePatterns: [
    "__tests__", "node_modules"
  ]
};