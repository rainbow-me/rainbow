import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RUNNER = join(__dirname, 'e2e-run.sh');

describe('transaction attempt setup', () => {
  it('starts and funds Anvil, then resets and funds it again before a retry', () => {
    const { calls, ledger, result } = runTransactionRetry(false);
    expect(result.status).toBe(0);
    expect(calls).toEqual(['start', 'fund', 'maestro-1', 'reset', 'fund', 'maestro-2']);
    expect(ledger.at(-1)).toEqual(expect.objectContaining({ attempts: 2, pass_duration: expect.any(Number), status: 'retried' }));
  });

  it('restarts and funds Anvil when resetting the fork fails', () => {
    const { calls, ledger, result } = runTransactionRetry(true);
    expect(result.status).toBe(0);
    expect(calls).toEqual(['start', 'fund', 'maestro-1', 'reset', 'reset', 'reset', 'start', 'fund', 'maestro-2']);
    expect(ledger.at(-1)).toEqual(expect.objectContaining({ attempts: 2, pass_duration: expect.any(Number), status: 'retried' }));
  });
});

function runTransactionRetry(resetFails: boolean) {
  const root = mkdtempSync(join(tmpdir(), 'e2e-run-'));
  const bin = join(root, 'bin');
  const flow = join(root, 'e2e/flows/transactions/TestTransaction.yaml');
  const log = join(root, 'calls.log');

  mkdirSync(bin, { recursive: true });
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'e2e/flows/transactions'), { recursive: true });
  writeFileSync(join(root, '.env'), 'DEV_PKEY=test-private-key\n');
  writeFileSync(flow, 'appId: ${APP_ID}\n---\n');

  executable(
    join(root, 'scripts/anvil.sh'),
    `#!/bin/bash
if [ "\${1:-}" = reset ]; then
  echo reset >> "$FAKE_E2E_LOG"
  [ "$FAKE_RESET_FAIL" != true ]
  exit
fi
echo start >> "$FAKE_E2E_LOG"
trap 'exit 0' INT TERM
while true; do /bin/sleep 1; done
`
  );
  executable(
    join(bin, 'cast'),
    `#!/bin/bash
case "$1" in
  block-number) exit 0 ;;
  wallet) echo 0xtestwallet ;;
  rpc) echo fund >> "$FAKE_E2E_LOG" ;;
  to-unit) echo 20 ;;
esac
`
  );
  executable(join(bin, 'lsof'), '#!/bin/bash\nexit 1\n');
  executable(
    join(bin, 'maestro'),
    `#!/bin/bash
output=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = --debug-output ]; then output="$2"; shift; fi
  shift
done
mkdir -p "$output"
attempt_file="$FAKE_E2E_LOG.attempt"
attempt=$(($(cat "$attempt_file" 2>/dev/null || echo 0) + 1))
echo "$attempt" > "$attempt_file"
echo "maestro-$attempt" >> "$FAKE_E2E_LOG"
[ "$attempt" -gt 1 ]
`
  );

  const result = spawnSync('bash', [RUNNER, '--flow', flow, '--platform', 'android', '--retries', '2'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      ANVIL_READY_ATTEMPTS: '1',
      FAKE_E2E_LOG: log,
      FAKE_RESET_FAIL: String(resetFails),
      PATH: `${bin}:${process.env.PATH}`,
    },
  });
  const calls = readFileSync(log, 'utf8').trim().split('\n');
  const ledger = readFileSync(join(root, 'e2e-results/shard-1.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map(line => JSON.parse(line));

  return { calls, ledger, result };
}

function executable(path: string, contents: string): void {
  writeFileSync(path, contents);
  chmodSync(path, 0o755);
}
