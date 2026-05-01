/* eslint-disable import/no-default-export */

// @ts-check
import { platformAndroid } from '@rock-js/platform-android';
import { platformIOS } from '@rock-js/platform-ios';
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
    // Files outside native dirs that still affect the produced .app (mostly the
    // JS bundle baked in via `rock bundle`). Without these, JS-only changes
    // hit a stale cached .app and never make it into CI builds.
    extraSources: ['is_testing', '.xcode-version', 'metro.config.js', 'metro.transform.js', 'babel.config.js'],
  },
};
