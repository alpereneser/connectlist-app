const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Hermes için optimizasyonlar
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Sentry için source map desteği
config.transformer.enableBabelRCLookup = false;
config.transformer.enableBabelRuntime = false;

module.exports = config;