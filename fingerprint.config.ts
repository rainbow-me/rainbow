import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { Config } from '@expo/fingerprint/build/Fingerprint.types';

const ENVIRONMENT_INPUTS = [
  'CC',
  'CFLAGS',
  'CPPFLAGS',
  'CXX',
  'CXXFLAGS',
  'LDFLAGS',
  'RCT_NEW_ARCH_ENABLED',
  'SKIP_FLIPPER',
  'SWIFTFLAGS',
  'USE_HERMES',
];
const FILE_INPUTS = [
  '.env',
  '.node-version',
  '.ruby-version',
  '.xcode-version',
  '.yarnrc.yml',
  'Gemfile',
  'Gemfile.lock',
  ...(existsSync(join(import.meta.dirname, 'is_testing')) ? ['is_testing'] : []),
  'package.json',
  'yarn.lock',
];

/** Adds Rainbow's root build inputs and selected toolchains to Expo's fingerprint. */
export const config: Config = {
  extraSources: [
    ...FILE_INPUTS.map(filePath => ({ type: 'file' as const, filePath, reasons: ['rainbowBuildInput'] })),
    {
      type: 'contents',
      id: 'rainbowBuildEnvironment',
      reasons: ['rainbowBuildInput'],
      contents: JSON.stringify({
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        xcode: process.platform === 'darwin' ? toolVersion('xcodebuild', ['-version']) : null,
        java: toolVersion(process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin/java') : 'java', ['-version']),
        environment: ENVIRONMENT_INPUTS.map(name => [name, process.env[name] ?? null]),
      }),
    },
  ],
};

function toolVersion(command: string, args: string[]): string | null {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10000 });
  return result.status === 0 ? `${result.stdout}${result.stderr}`.trim() : null;
}
