// React Native configuration for monorepo
module.exports = {
  // Workaround for monorepo structure
  // This tells React Native where to find the native modules
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
    },
  },
};
