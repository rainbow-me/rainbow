import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { transformSync } from '@babel/core';

const require = createRequire(import.meta.url);
const result = transformSync('import { DOTENV_VALUE } from "react-native-dotenv"; export const value = DOTENV_VALUE;', {
  configFile: false,
  babelrc: false,
  plugins: [[require.resolve('react-native-dotenv'), { moduleName: 'react-native-dotenv' }]],
});

assert(result?.code, 'Babel must emit the transformed module');
process.stdout.write(result.code);
