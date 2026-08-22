import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DOWNLOADER = join(__dirname, 'download-github-artifact.sh');

describe('artifact downloads', () => {
  it('retries a corrupt response and replaces the destination only with a valid zip', () => {
    const root = mkdtempSync(join(tmpdir(), 'artifact-download-'));
    const bin = join(root, 'bin');
    const output = join(root, 'artifact.zip');
    const attempts = join(root, 'attempts');
    mkdirSync(bin);
    writeFileSync(output, 'existing');

    executable(
      join(bin, 'curl'),
      `#!/bin/bash
output=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = -o ]; then output="$2"; shift; fi
  shift
done
attempt=$(($(cat "$FAKE_DOWNLOAD_ATTEMPTS" 2>/dev/null || echo 0) + 1))
echo "$attempt" > "$FAKE_DOWNLOAD_ATTEMPTS"
if [ "$attempt" -eq 1 ]; then echo corrupt > "$output"; else echo valid > "$output"; fi
`
    );
    executable(join(bin, 'unzip'), '#!/bin/bash\n[ "$(cat "$2")" = valid ]\n');
    executable(join(bin, 'sleep'), '#!/bin/bash\nexit 0\n');

    const result = spawnSync('bash', [DOWNLOADER, '42', output], {
      encoding: 'utf8',
      env: {
        ...process.env,
        ARTIFACT_DOWNLOAD_ATTEMPTS: '2',
        FAKE_DOWNLOAD_ATTEMPTS: attempts,
        GITHUB_REPOSITORY: 'rainbow-me/rainbow',
        GITHUB_TOKEN: 'test-token',
        PATH: `${bin}:${process.env.PATH}`,
      },
    });

    expect(result.status).toBe(0);
    expect(readFileSync(attempts, 'utf8').trim()).toBe('2');
    expect(readFileSync(output, 'utf8')).toBe('valid\n');
    expect(existsSync(`${output}.tmp`)).toBe(false);
  });
});

function executable(path: string, contents: string): void {
  writeFileSync(path, contents);
  chmodSync(path, 0o755);
}
