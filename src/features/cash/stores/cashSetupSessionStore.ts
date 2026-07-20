import { createBaseStore } from '@storesjs/stores';

type EmptyCashSetupSession = {
  status: 'empty';
};

type PhoneSubmittedCashSetupSession = {
  status: 'phoneSubmitted';
  phoneNationalNumber: string;
  userId: string;
  resendAfter: number;
};

type VerifiedCashSetupSession = {
  status: 'phoneVerified';
  phoneNationalNumber: string;
  userId: string;
  bootstrapToken: string;
  bootstrapTokenExpiresAt: number;
};

type CashSetupSession = EmptyCashSetupSession | PhoneSubmittedCashSetupSession | VerifiedCashSetupSession;

type CashSetupSessionStore = {
  session: CashSetupSession;
  setPhoneSubmitted: (params: { userId: string; phoneNationalNumber: string; resendAfter: number }) => void;
  setResendAfter: (resendAfter: number) => void;
  setPhoneVerified: (params: { userId: string; phoneNationalNumber: string; token: string; expiresAt: number }) => void;
  reset: () => void;
};

const EMPTY_SESSION: EmptyCashSetupSession = { status: 'empty' };

// Intentionally memory-only (PII)
export const useCashSetupSessionStore = createBaseStore<CashSetupSessionStore>((set, get) => ({
  session: EMPTY_SESSION,
  setPhoneSubmitted: ({ userId, phoneNationalNumber, resendAfter }) =>
    set({ session: { status: 'phoneSubmitted', userId, phoneNationalNumber, resendAfter } }),
  setResendAfter: resendAfter => {
    const { session } = get();
    if (session.status !== 'phoneSubmitted') return;
    set({ session: { ...session, resendAfter } });
  },
  setPhoneVerified: ({ userId, phoneNationalNumber, token, expiresAt }) =>
    set({ session: { status: 'phoneVerified', userId, phoneNationalNumber, bootstrapToken: token, bootstrapTokenExpiresAt: expiresAt } }),
  reset: () => set({ session: EMPTY_SESSION }),
}));

export function selectIsPhoneVerified(state: CashSetupSessionStore): boolean {
  return state.session.status === 'phoneVerified' && state.session.bootstrapTokenExpiresAt > Date.now();
}

export function selectResendAfter(state: CashSetupSessionStore): number | null {
  return state.session.status === 'phoneSubmitted' ? state.session.resendAfter : null;
}
