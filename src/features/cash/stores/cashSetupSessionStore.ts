import { createBaseStore } from '@storesjs/stores';

export type CashSetupDateOfBirth = {
  year: number;
  month: number;
  day: number;
};

export type CashSetupIdentity = {
  firstName: string;
  lastName: string;
  dateOfBirth: CashSetupDateOfBirth;
};

// Identifies one accepted phone submission by reference, so async results can
// be checked against the submission that started them.
export type PhoneChallenge = Readonly<{ userId: string }>;

export type CashSetupGovernmentIdKind = 'GOVERNMENT_ID_KIND_SSN_LAST4';

declare const cashSetupUsSsnLast4Brand: unique symbol;

export type CashSetupUsSsnLast4 = string & { readonly [cashSetupUsSsnLast4Brand]: true };

export type CashSetupGovernmentId = {
  countryCode: 'US';
  kind: CashSetupGovernmentIdKind;
  value: CashSetupUsSsnLast4;
};

type EmptyCashSetupSession = {
  status: 'empty';
};

type PhoneSubmittedCashSetupSession = {
  status: 'phoneSubmitted';
  phoneNationalNumber: string;
  challenge: PhoneChallenge;
  resendAfter: number;
};

type VerifiedCashSetupSession = {
  status: 'phoneVerified';
  phoneNationalNumber: string;
  userId: string;
  bootstrapToken: string;
  bootstrapTokenExpiresAt: number;
  identity: CashSetupIdentity | null;
  governmentId: CashSetupGovernmentId | null;
};

type CashSetupSession = EmptyCashSetupSession | PhoneSubmittedCashSetupSession | VerifiedCashSetupSession;

type CashSetupSessionStore = {
  session: CashSetupSession;
  getIsCurrentChallenge: (challenge: PhoneChallenge) => boolean;
  setPhoneSubmitted: (params: { userId: string; phoneNationalNumber: string; resendAfter: number }) => void;
  setResendAfter: (challenge: PhoneChallenge, resendAfter: number) => void;
  setPhoneVerified: (challenge: PhoneChallenge, credential: { bootstrapToken: string; expiresAt: number }) => void;
  setIdentity: (identity: CashSetupIdentity) => void;
  setGovernmentId: (governmentId: CashSetupGovernmentId) => void;
  reset: () => void;
};

const EMPTY_SESSION: EmptyCashSetupSession = { status: 'empty' };

// Intentionally memory-only (PII)
export const useCashSetupSessionStore = createBaseStore<CashSetupSessionStore>((set, get) => ({
  session: EMPTY_SESSION,
  getIsCurrentChallenge: challenge => {
    const { session } = get();
    return session.status === 'phoneSubmitted' && session.challenge === challenge;
  },
  setPhoneSubmitted: ({ userId, phoneNationalNumber, resendAfter }) =>
    set({ session: { status: 'phoneSubmitted', challenge: { userId }, phoneNationalNumber, resendAfter } }),
  setResendAfter: (challenge, resendAfter) =>
    set(state => {
      const { session } = state;
      if (session.status !== 'phoneSubmitted' || session.challenge !== challenge || session.resendAfter === resendAfter) return state;
      return { session: { ...session, resendAfter } };
    }),
  setPhoneVerified: (challenge, { bootstrapToken, expiresAt }) =>
    set(state => {
      const { session } = state;
      if (session.status !== 'phoneSubmitted' || session.challenge !== challenge) return state;
      return {
        session: {
          status: 'phoneVerified',
          userId: challenge.userId,
          phoneNationalNumber: session.phoneNationalNumber,
          bootstrapToken,
          bootstrapTokenExpiresAt: expiresAt,
          identity: null,
          governmentId: null,
        },
      };
    }),
  setIdentity: identity => {
    const { session } = get();
    if (session.status !== 'phoneVerified') return;
    set({ session: { ...session, identity } });
  },
  setGovernmentId: governmentId => {
    const { session } = get();
    if (session.status !== 'phoneVerified') return;
    set({ session: { ...session, governmentId } });
  },
  reset: () => set(state => (state.session === EMPTY_SESSION ? state : { session: EMPTY_SESSION })),
}));

export function selectIsPhoneVerified(state: CashSetupSessionStore): boolean {
  return state.session.status === 'phoneVerified' && state.session.bootstrapTokenExpiresAt > Date.now();
}

export function selectResendAfter(state: CashSetupSessionStore): number | null {
  return state.session.status === 'phoneSubmitted' ? state.session.resendAfter : null;
}
