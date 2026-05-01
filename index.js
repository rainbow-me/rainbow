/* eslint-disable import/no-commonjs */

/*
It needs to be an import statement because otherwise it doesn't load properly
likely because of typescript.
*/
import '@walletconnect/react-native-compat';

import { initSentry } from '@/logger/sentry';

// TODO: Migrate to modular API and remove this stopgap (FEPLAT-80)
// Silence RNFB v23 namespaced-API deprecation warnings.
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

initSentry();
require('react-native-gesture-handler');
require('./shim');
require('./src/App');
