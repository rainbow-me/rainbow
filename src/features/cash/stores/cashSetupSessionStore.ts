import { createBaseStore, shallowEqual } from '@storesjs/stores';

import {
  createCashSetupIdentity,
  createUsSsnLast4GovernmentId,
  isValidUsSsnLast4,
  type CashSetupGovernmentId,
  type CashSetupIdentity,
  type CashSetupIdentityDraft,
} from '../services/cashSetupIdentityService';

// Identifies one accepted phone submission by reference, so async results can
// be checked against the submission that started them.
export type PhoneChallenge = Readonly<{ kind: 'signup'; userId: string }> | Readonly<{ kind: 'resume'; resumeId: string }>;

type EmptyCashSetupSession = {
  status: 'empty';
};

type PhoneSubmittedCashSetupSession = {
  status: 'phoneSubmitted';
  phoneNationalNumber: string;
  challenge: PhoneChallenge;
  resendAfter: number;
};

type PhoneAlreadyRegisteredCashSetupSession = {
  status: 'phoneAlreadyRegistered';
  phoneNationalNumber: string;
};

type VerifiedCashSetupSession = {
  status: 'phoneVerified';
  phoneNationalNumber: string;
  bootstrapToken: string;
  bootstrapTokenExpiresAt: number;
  identity: CashSetupIdentityDraft;
  ssnLast4: string;
};

type CashSetupSession =
  | EmptyCashSetupSession
  | PhoneSubmittedCashSetupSession
  | PhoneAlreadyRegisteredCashSetupSession
  | VerifiedCashSetupSession;

type CashSetupSessionStore = {
  session: CashSetupSession;
  getGovernmentId: () => CashSetupGovernmentId | null;
  getIdentity: () => CashSetupIdentity | null;
  getIsCurrentChallenge: (challenge: PhoneChallenge) => boolean;
  setPhoneSubmitted: (params: { challenge: PhoneChallenge; phoneNationalNumber: string; resendAfter: number }) => void;
  setPhoneAlreadyRegistered: (phoneNationalNumber: string) => void;
  setResendAfter: (challenge: PhoneChallenge, resendAfter: number) => void;
  setPhoneVerified: (challenge: PhoneChallenge, credential: { bootstrapToken: string; expiresAt: number }) => void;
  setDateOfBirth: (dateOfBirth: CashSetupIdentityDraft['dateOfBirth']) => void;
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setSsnLast4: (ssnLast4: string) => void;
  reset: () => void;
};

const EMPTY_SESSION: EmptyCashSetupSession = { status: 'empty' };
const EMPTY_IDENTITY: CashSetupIdentityDraft = { firstName: '', lastName: '', dateOfBirth: null };

// Intentionally memory-only (PII)
export const useCashSetupSessionStore = createBaseStore<CashSetupSessionStore>((set, get) => {
  function setIdentityField<Field extends keyof CashSetupIdentityDraft>(field: Field, value: CashSetupIdentityDraft[Field]) {
    set(state => {
      const { session } = state;
      if (session.status !== 'phoneVerified' || shallowEqual(session.identity[field], value)) return state;
      return { session: { ...session, identity: { ...session.identity, [field]: value } } };
    });
  }

  return {
    session: EMPTY_SESSION,
    getGovernmentId: () => {
      const { session } = get();
      return session.status === 'phoneVerified' && isValidUsSsnLast4(session.ssnLast4)
        ? createUsSsnLast4GovernmentId(session.ssnLast4)
        : null;
    },
    getIdentity: () => {
      const { session } = get();
      return session.status === 'phoneVerified' ? createCashSetupIdentity(session.identity) : null;
    },
    getIsCurrentChallenge: challenge => {
      const { session } = get();
      return session.status === 'phoneSubmitted' && session.challenge === challenge;
    },
    setPhoneSubmitted: ({ challenge, phoneNationalNumber, resendAfter }) =>
      set({ session: { status: 'phoneSubmitted', challenge, phoneNationalNumber, resendAfter } }),
    setPhoneAlreadyRegistered: phoneNationalNumber => set({ session: { status: 'phoneAlreadyRegistered', phoneNationalNumber } }),
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
            phoneNationalNumber: session.phoneNationalNumber,
            bootstrapToken,
            bootstrapTokenExpiresAt: expiresAt,
            identity: EMPTY_IDENTITY,
            ssnLast4: '',
          },
        };
      }),
    setDateOfBirth: dateOfBirth => setIdentityField('dateOfBirth', dateOfBirth),
    setFirstName: firstName => setIdentityField('firstName', firstName),
    setLastName: lastName => setIdentityField('lastName', lastName),
    setSsnLast4: value =>
      set(state => {
        const { session } = state;
        const ssnLast4 = value.replace(/\D/g, '').slice(0, 4);
        if (session.status !== 'phoneVerified' || session.ssnLast4 === ssnLast4) return state;
        return { session: { ...session, ssnLast4 } };
      }),
    reset: () => set(state => (state.session === EMPTY_SESSION ? state : { session: EMPTY_SESSION })),
  };
});

export function selectIsPhoneVerified(state: CashSetupSessionStore): boolean {
  return state.session.status === 'phoneVerified' && state.session.bootstrapTokenExpiresAt > Date.now();
}

export function selectResendAfter(state: CashSetupSessionStore): number | null {
  return state.session.status === 'phoneSubmitted' ? state.session.resendAfter : null;
}
