const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Hermes için optimizasyonlar ve script phase uyarısını giderme
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Hermes engine konfigürasyonu
config.transformer.hermesCommand = 'hermes';
config.transformer.enableHermes = true;

// Sentry için source map desteği
config.transformer.enableBabelRCLookup = false;
config.transformer.enableBabelRuntime = false;

// Build optimizasyonları
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;