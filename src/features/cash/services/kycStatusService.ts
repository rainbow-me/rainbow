import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

import { getUserStatus, toKycOutcome, type KycOutcome } from './userClient';

export async function readKycOutcome(bootstrapToken: string): Promise<KycOutcome | null> {
  const check = async () => {
    const { kycStatus, kycRejectionReason } = await getUserStatus({ bootstrapToken });
    return toKycOutcome(kycStatus, kycRejectionReason);
  };
  return check().catch(() => delay(time.seconds(2)).then(check));
}

export function trackKycOutcome(outcome: KycOutcome, source: 'resume' | 'return'): void {
  if (outcome === 'approved') analytics.track(analytics.event.cashKycApproved);
  else if (outcome === 'reviewing') analytics.track(analytics.event.cashKycAwaitingDecision, { source });
  else if (outcome === 'rejected') analytics.track(analytics.event.cashKycFailed, { reason: 'rejected' });
  else analytics.track(analytics.event.cashKycFailed, { reason: 'state_not_supported' });
}
