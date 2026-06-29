import { type SandboxTestCaseResult } from '../../core/models/cases';
import { ALLOWED_URL, BLOCKED_URL } from '../../core/models/hosts';
import { classifyHttpAllowed, classifyHttpBlocked } from '../../core/services/classifier';

// A blocked HTTP request must never return a real 2xx; on iOS it currently
// hangs, so we cap the wait and treat the hang as a block.
const HTTP_BLOCKED_TIMEOUT_MS = 4000;

export async function probeHttpAllowed(): Promise<SandboxTestCaseResult> {
  try {
    const response = await fetch(ALLOWED_URL);
    return classifyHttpAllowed({ ok: response.ok, status: response.status });
  } catch (error) {
    return classifyHttpAllowed({ error: (error as Error).message });
  }
}

export function probeHttpBlocked(): Promise<SandboxTestCaseResult> {
  return new Promise(resolve => {
    let settled = false;
    const finish = (result: SandboxTestCaseResult) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    };
    const timer = setTimeout(() => finish(classifyHttpBlocked({ kind: 'timeout' })), HTTP_BLOCKED_TIMEOUT_MS);
    fetch(BLOCKED_URL)
      .then(response => finish(classifyHttpBlocked({ kind: 'resolved', status: response.status })))
      .catch((error: Error) => finish(classifyHttpBlocked({ kind: 'rejected', error: error.message })))
      .finally(() => clearTimeout(timer));
  });
}
