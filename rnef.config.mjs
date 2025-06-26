import { platformIOS } from '@rnef/platform-ios';
import { platformAndroid } from '@rnef/platform-android';
import { pluginMetro } from '@rnef/plugin-metro';

/** @type {import('@rnef/cli').Config} */
export default {
  bundler: pluginMetro({
    startTimeout: 180000, // 3 minutes timeout for Metro startup
    resetCache: true, // Reset Metro cache on startup
  }),
  platforms: {
    ios: platformIOS(),
    android: platformAndroid(),
  },
  remoteCacheProvider: 'github-actions',
};
