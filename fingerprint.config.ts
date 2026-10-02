import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Config } from '@expo/fingerprint/build/Fingerprint.types';

/**
 * Adds external build inputs to the native file that consumes them, without changing the file on disk.
 */
export const config: Config = {
  fileHookTransform(source, chunk, isEndOfFile) {
    if (source.type !== 'file' || !isEndOfFile) return chunk;

    if (source.filePath === 'ios/Podfile') {
      return JSON.stringify({
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        xcode: process.platform === 'darwin' ? toolVersion('xcodebuild', ['-version']) : null,
      });
    }
    if (source.filePath === 'android/app/build.gradle') {
      return JSON.stringify({
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        java: toolVersion(process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin/java') : 'java', ['-version']),
        branchKey: androidBranchKey(),
      });
    }
    return chunk;
  },
};

function androidBranchKey(): string | null {
  const contents = readFileSync(join(import.meta.dirname, '.env'), 'utf8');
  let value: string | null = null;
  // Gradle uses raw values and the last matching assignment, rather than dotenv parsing.
  for (const line of contents.split(/\r\n|\n|\r/)) {
    if (line.startsWith('BRANCH_KEY=')) value = line.slice('BRANCH_KEY='.length);
  }
  return value;
}

function toolVersion(command: string, args: string[]): string | null {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10000 });
  return result.status === 0 ? `${result.stdout}${result.stderr}`.trim() : null;
}
