module.exports = {
  name: 'Rainbow',
  displayName: 'Rainbow',
  jsEngine: 'hermes',
  extra: {
    eas: {
      projectId: '37220082-ca9d-4ff9-b17b-1275caa1478a',
    },
  },
  owner: 'rainbowdotme',
  plugins: ['@config-plugins/detox'],
  experiments: {
    turboModules: process.env.IS_TESTING === 'false',
  },
};
