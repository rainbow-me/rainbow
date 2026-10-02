import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const fromStim = createRequire(require.resolve('stim/package.json'));
const { createFingerprintAsync }: typeof import('@expo/fingerprint/build/Fingerprint') = fromStim('@expo/fingerprint');

const result = await createFingerprintAsync(process.cwd(), { platforms: [], silent: true });
const environment = result.sources.find(source => source.type === 'contents' && source.id === 'rainbowBuildEnvironment');
const dotenv = result.sources.find(source => source.type === 'file' && source.filePath === '.env');
assert(environment?.hash && dotenv?.hash, 'Rainbow fingerprint configuration was not loaded');
process.stdout.write(result.hash);
