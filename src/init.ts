import { AppRegistry } from 'react-native';

async function initializeApplication() {
  const { Application } = require('@/App');

  AppRegistry.registerComponent('Rainbow', () => Application);
}

initializeApplication();
