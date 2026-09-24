import { createBaseStore } from '@storesjs/stores';

import { logger } from '@/logger';

import { readKycOutcome, trackKycOutcome } from '../services/kycStatusService';
import { type KycOutcome } from '../services/userClient';
import { useCashAccountStore } from './cashAccountStore';
import { selectIsPhoneVerified, useCashSetupSessionStore } from './cashSetupSessionStore';

export type KycReturnState = 'idle' | 'checking' | KycOutcome;

export type KycReturnResult = 'outcome' | 'notSubmitted' | 'expired' | 'cancelled' | 'skipped';

type KycReturnFlowStore = {
  state: KycReturnState;
  // Identifies one check so a result from a dismissed Setup cannot write into
  // a later one. This module-level store outlives the setup screen.
  run: object | null;
  check: () => Promise<KycReturnResult>;
  reset: () => void;
};

type RetainedCredential = { bootstrapToken: string; expiresAt: number };

type CredentialStanding =
  | { kind: 'live'; credential: RetainedCredential; kycSubmission: 'notSubmitted' | 'submitted' }
  | { kind: 'expired' }
  | { kind: 'absent' };

type StatusRead = { ok: true; verdict: KycOutcome | null } | { ok: false; error: unknown };

export const useKycReturnFlowStore = createBaseStore<KycReturnFlowStore>((set, get) => {
  function finish(result: KycReturnResult): KycReturnResult {
    set({ run: null, state: 'idle' });
    return result;
  }

  return {
    state: 'idle',
    run: null,

    check: async () => {
      if (get().state !== 'idle') return 'skipped';
      // A device that already recorded an account must not enrol a second one with a leftover token.
      if (useCashAccountStore.getState().userId != null) return 'skipped';

      const before = getCredentialStanding();
      if (before.kind === 'absent') return 'skipped';
      if (before.kind === 'expired') {
        useCashSetupSessionStore.getState().reset();
        return 'expired';
      }

      const run = {};
      set({ run, state: 'checking' });
      const read = await readStatus(before.credential.bootstrapToken);
      // Setup closed meanwhile; its reset() already returned the flow to idle.
      if (get().run !== run) return 'cancelled';

      const after = getCredentialStanding(before.credential);
      if (after.kind === 'absent') return finish('cancelled');
      if (after.kind === 'expired') {
        useCashSetupSessionStore.getState().reset();
        return finish('expired');
      }

      if (!read.ok) logger.warn('[kycReturnFlowStore]: KYC status check failed', { error: read.error });
      const outcome = resolveReturnOutcome(read.ok ? read.verdict : null, after.kycSubmission);
      if (outcome === null) return finish('notSubmitted');

      useCashSetupSessionStore.getState().markKycSubmitted(after.credential.bootstrapToken);
      trackKycOutcome(outcome, 'return');
      set({ state: outcome });
      return 'outcome';
    },

    reset: () => set({ run: null, state: 'idle' }),
  };
});

export function getShouldCheckKycOnReturn(): boolean {
  if (useCashAccountStore.getState().userId != null) return false;
  const standing = getCredentialStanding();
  if (standing.kind === 'expired') useCashSetupSessionStore.getState().reset();
  return standing.kind === 'live';
}

// How the retained credential stands right now. After a read, `expected` is the
// credential the read was made with: the store must still hold that same one.
function getCredentialStanding(expected?: RetainedCredential): CredentialStanding {
  const sessionStore = useCashSetupSessionStore.getState();
  const { session } = sessionStore;
  if (session.status === 'phoneVerified' && (expected === undefined || session.bootstrapToken === expected.bootstrapToken)) {
    if (!selectIsPhoneVerified(sessionStore)) return { kind: 'expired' };
    return {
      kind: 'live',
      credential: { bootstrapToken: session.bootstrapToken, expiresAt: session.bootstrapTokenExpiresAt },
      kycSubmission: session.kycSubmission,
    };
  }
  // The session store empties a credential itself when it expires; anything else replaced it.
  if (expected !== undefined && session.status === 'empty' && Date.now() >= expected.expiresAt) return { kind: 'expired' };
  return { kind: 'absent' };
}

// Never throws: what a failed read means depends on the session, which is only
// safe to consult once the read has landed and the check is still current.
async function readStatus(bootstrapToken: string): Promise<StatusRead> {
  try {
    return { ok: true, verdict: await readKycOutcome(bootstrapToken) };
  } catch (error) {
    return { ok: false, error };
  }
}

// A verdict stands on its own. Without one, a submitted identity is still with
// the provider; an unsubmitted one has nothing to show yet.
function resolveReturnOutcome(verdict: KycOutcome | null, kycSubmission: 'notSubmitted' | 'submitted'): KycOutcome | null {
  if (verdict !== null) return verdict;
  return kycSubmission === 'submitted' ? 'reviewing' : null;
}
