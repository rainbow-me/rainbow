// @ts-check
import { platformIOS } from '@rnef/platform-ios';
import { platformAndroid } from '@rnef/platform-android';
import { pluginMetro } from '@rnef/plugin-metro';

/** @type {import('@rnef/cli').Config} */
export default {
  bundler: pluginMetro(),
  platforms: {
    ios: platformIOS(),
    android: platformAndroid(),
  },
  remoteCacheProvider: 'github-actions',
};
