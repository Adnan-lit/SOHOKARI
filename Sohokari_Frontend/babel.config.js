module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@api':        './src/api',
          '@components': './src/components',
          '@screens':    './src/screens',
          '@hooks':      './src/hooks',
          '@store':      './src/store',
          '@services':   './src/services',
          '@utils':      './src/utils',
          '@theme':      './src/theme',
          '@constants':  './src/constants',
        },
      }],
      // 'react-native-reanimated/plugin' ← add this back later when needed
    ],
  };
};