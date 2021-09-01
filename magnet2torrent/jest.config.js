// jest.config.js
// const { defaults } = require('jest-config');
module.exports = {
    "testResultsProcessor": "jest-sonar-reporter",
    modulePathIgnorePatterns: ["<rootDir>/test-report.xml"]

};