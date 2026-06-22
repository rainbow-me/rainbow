import { type SandboxTestCaseResult } from '../models/cases';

export function classifyHttpAllowed(outcome: { ok: boolean; status: number } | { error: string }): SandboxTestCaseResult {
  if ('error' in outcome) {
    return { passed: false, detail: `errored: ${outcome.error}` };
  }
  return {
    passed: outcome.ok,
    detail: outcome.ok ? `reachable (status ${outcome.status})` : `unexpected status ${outcome.status}`,
  };
}

export type BlockedHttpOutcome = { kind: 'resolved'; status: number } | { kind: 'rejected'; error: string } | { kind: 'timeout' };

export function classifyHttpBlocked(outcome: BlockedHttpOutcome): SandboxTestCaseResult {
  // Only a real success response means the sandbox let the request through. A
  // reject, a non-2xx (Android returns a synthetic 500), or a hang we time out
  // (iOS currently drops the task) all satisfy the invariant.
  if (outcome.kind === 'resolved' && outcome.status >= 200 && outcome.status < 300) {
    return { passed: false, detail: `not blocked (status ${outcome.status})` };
  }
  const detail =
    outcome.kind === 'resolved'
      ? `blocked (status ${outcome.status})`
      : outcome.kind === 'rejected'
        ? 'blocked (request failed)'
        : 'blocked (no response)';
  return { passed: true, detail };
}

export function classifyWebViewAllowed(loaded: boolean): SandboxTestCaseResult {
  return {
    passed: loaded,
    detail: loaded ? 'allow-listed page loaded' : 'allow-listed page did not load',
  };
}

export function classifyWebViewBlocked(reachedBlockedHost: boolean, observedUrl?: string): SandboxTestCaseResult {
  return {
    passed: !reachedBlockedHost,
    detail: reachedBlockedHost ? `loaded blocked host: ${observedUrl ?? ''}` : 'blocked (did not load)',
  };
}
