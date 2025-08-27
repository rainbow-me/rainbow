/* eslint-disable import/no-default-export */

// @ts-check
import { platformIOS } from '@rock-js/platform-ios';
import { platformAndroid } from '@rock-js/platform-android';
import { pluginMetro } from '@rock-js/plugin-metro';

const assets = ['./src/assets/fonts'];

/** @type {import('rock').Config} */
export default {
  bundler: pluginMetro(),
  platforms: {
    ios: platformIOS({ assets }),
    android: platformAndroid({ assets }),
  },
  remoteCacheProvider: 'github-actions',
  fingerprint: {
    extraSources: ['.env'],
  },
};
