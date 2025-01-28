
const { getDefaultConfig } = require('@react-native-community/cli-platform-android');

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  server: {
    port: 8081
  },
  watchFolders: [__dirname],
};
