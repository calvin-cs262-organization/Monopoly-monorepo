const preset = require('jest-expo/jest-preset');

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '^../../config$': '<rootDir>/__mocks__/config.ts',
    '^@expo/vector-icons': '<rootDir>/__mocks__/expo-vector-icons.ts',
    // react-native resolver doesn't support package exports; map msw subpaths explicitly
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    // rettime is pure ESM (no CJS build) — use a hand-written CJS shim
    '^rettime$': '<rootDir>/__mocks__/rettime.js',
    // until-async and @open-draft/deferred-promise are pure ESM — use CJS shims
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
