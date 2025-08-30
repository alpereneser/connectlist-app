module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Sentry için source map desteği
      '@sentry/react-native/dist/js/tools/sentryBabelPlugin',
    ],
  };
};
