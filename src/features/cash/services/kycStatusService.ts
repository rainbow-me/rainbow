import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

import { isCashAccessRefusedError } from './cashAccessRefusal';
import { getUserStatus, toKycOutcome, type KycOutcome, type KycRejectionReason } from './userClient';

export async function readKycOutcome(
  bootstrapToken: string
): Promise<{ outcome: KycOutcome | null; kycRejectionReason?: KycRejectionReason }> {
  const check = async () => {
    const { kycStatus, kycRejectionReason } = await getUserStatus({ bootstrapToken });
    return { outcome: toKycOutcome(kycStatus, kycRejectionReason), kycRejectionReason };
  };
  return check().catch(error => {
    if (isCashAccessRefusedError(error)) throw error;
    return delay(time.seconds(2)).then(check);
  });
}

export function trackKycOutcome(outcome: KycOutcome, source: 'resume' | 'return'): void {
  if (outcome === 'approved') analytics.track(analytics.event.cashKycApproved);
  else if (outcome === 'reviewing') analytics.track(analytics.event.cashKycAwaitingDecision, { source });
  else if (outcome === 'rejected') analytics.track(analytics.event.cashKycFailed, { reason: 'rejected' });
  else analytics.track(analytics.event.cashKycFailed, { reason: 'state_not_supported' });
}
