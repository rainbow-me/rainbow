/* eslint-disable import/no-default-export */

import { platformIOS } from '@rnef/platform-ios';
import { platformAndroid } from '@rnef/platform-android';
import { pluginMetro } from '@rnef/plugin-metro';

const assets = ['./src/assets/fonts'];

/** @type {import('@rnef/cli').Config} */
export default {
  bundler: pluginMetro(),
  platforms: {
    ios: platformIOS({ assets }),
    android: platformAndroid({ assets }),
  },
  remoteCacheProvider: 'github-actions',
};
