const preset = require('jest-expo/jest-preset');

module.exports = {
  rootDir: '../..',
  preset: 'jest-expo',
  globalSetup: '<rootDir>/tests/integration/setup.js',
  globalTeardown: '<rootDir>/tests/integration/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/jest-setup.ts'],
  testMatch: ['<rootDir>/tests/integration/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    // Override config so components call the local Express server, not the mock
    '^../../config$': '<rootDir>/tests/integration/config.ts',
    '^@expo/vector-icons': '<rootDir>/__mocks__/expo-vector-icons.ts',
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    '^rettime$': '<rootDir>/__mocks__/rettime.js',
    '^until-async$': '<rootDir>/__mocks__/until-async.js',
    '^@open-draft/deferred-promise$': '<rootDir>/__mocks__/deferred-promise.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|msw|@mswjs|until-async|@open-draft))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  transform: {
    ...preset.transform,
    '^.+\\.mjs$': 'babel-jest',
  },
};
