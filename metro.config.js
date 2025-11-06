const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure package.json exports are enabled for modern packages like expo-router
config.resolver.unstable_enablePackageExports = true;

module.exports = config;