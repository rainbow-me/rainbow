import type { RainbowFetchResponse } from '@/framework/data/http/rainbowFetch';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

const CLAIM_POLL_INTERVAL = time.seconds(1);
const CLAIM_POLL_TIMEOUT = time.minutes(1);
const CLAIM_PENDING_STATUSES = new Set(['CLAIM_STATUS_UNSPECIFIED', 'CLAIM_STATUS_PENDING']);

type ResultWithStatus = {
  status?: string;
};

type PollClaimStatusOptions<T extends ResultWithStatus, R> = {
  fetchStatus: () => Promise<RainbowFetchResponse<R>>;
  getResult: (response: RainbowFetchResponse<R>) => T;
  intervalMs?: number;
  timeoutMs?: number;
};

export type PollClaimStatusResult<T, R> = {
  attempts: number;
  response: RainbowFetchResponse<R>;
  result: T;
};

export async function pollClaimStatus<T extends ResultWithStatus, R>({
  fetchStatus,
  getResult,
  intervalMs = CLAIM_POLL_INTERVAL,
  timeoutMs = CLAIM_POLL_TIMEOUT,
}: PollClaimStatusOptions<T, R>): Promise<PollClaimStatusResult<T, R>> {
  let attempts = 0;

  const fetchClaimStatus = async () => {
    const response = await fetchStatus();
    attempts += 1;
    return response;
  };

  const startedAt = Date.now();
  let lastResponse = await fetchClaimStatus();
  let claimResult = getResult(lastResponse);
  let status = claimResult.status;

  while (status && CLAIM_PENDING_STATUSES.has(status)) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Timed out waiting for claim status');
    }
    await delay(intervalMs);
    lastResponse = await fetchClaimStatus();
    claimResult = getResult(lastResponse);
    // eslint-disable-next-line require-atomic-updates
    status = claimResult.status;
  }

  if (!status) {
    throw new Error('Claim status missing in response');
  }
  if (status === 'CLAIM_STATUS_FAILED') {
    throw new Error(`Claim failed with status: ${status}`);
  }

  return { attempts, response: lastResponse, result: claimResult };
}
