import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const fromStim = createRequire(require.resolve('stim/package.json'));
const { createFingerprintAsync }: typeof import('@expo/fingerprint/build/Fingerprint') = fromStim('@expo/fingerprint');

const platform = process.argv[2];
assert(platform === 'ios' || platform === 'android');
const result = await createFingerprintAsync(process.cwd(), { platforms: [platform], silent: true });
assert(
  result.sources.some(source => source.type === 'dir' && source.filePath === platform),
  'The native project must be fingerprinted'
);
process.stdout.write(result.hash);
