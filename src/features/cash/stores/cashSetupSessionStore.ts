import { createBaseStore, shallowEqual } from '@storesjs/stores';

import {
  createCashSetupIdentity,
  createUsSsnLast4GovernmentId,
  isValidUsSsnLast4,
  type CashSetupGovernmentId,
  type CashSetupIdentity,
  type CashSetupIdentityDraft,
} from '../services/cashSetupIdentityService';

export type PhoneVerificationChallenge = Readonly<{ kind: 'signup'; userId: string }> | Readonly<{ kind: 'resume'; resumeId: string }>;

export type RecoveryPhoneChallenge = Readonly<{ kind: 'recovery'; recoveryId: string }>;

// Identifies one accepted phone submission by reference, so async results can
// be checked against the submission that started them.
export type PhoneChallenge = PhoneVerificationChallenge | RecoveryPhoneChallenge;

type EmptyCashSetupSession = {
  status: 'empty';
};

type PersonalDetailsDraft = {
  identity: CashSetupIdentityDraft;
  ssnLast4: string;
};

type PhoneSubmittedCashSetupSession = {
  status: 'phoneSubmitted';
  phoneNationalNumber: string;
  challenge: PhoneVerificationChallenge;
  resendAfter: number;
};

type RecoveryCashSetupSession = PersonalDetailsDraft & {
  status: 'recovery';
  phoneNationalNumber: string;
  challenge: RecoveryPhoneChallenge;
  resendAfter: number;
};

type PhoneAlreadyRegisteredCashSetupSession = {
  status: 'phoneAlreadyRegistered';
  phoneNationalNumber: string;
};

type VerifiedCashSetupSession = PersonalDetailsDraft & {
  status: 'phoneVerified';
  source: PhoneChallenge['kind'];
  phoneNationalNumber: string;
  bootstrapToken: string;
  bootstrapTokenExpiresAt: number;
};

type CashSetupSession =
  | EmptyCashSetupSession
  | PhoneSubmittedCashSetupSession
  | RecoveryCashSetupSession
  | PhoneAlreadyRegisteredCashSetupSession
  | VerifiedCashSetupSession;

type CashSetupSessionStore = {
  session: CashSetupSession;
  getGovernmentId: () => CashSetupGovernmentId | null;
  getIdentity: () => CashSetupIdentity | null;
  getPersonalDetailsDraft: <Field extends keyof PersonalDetailsDraft>(field: Field) => PersonalDetailsDraft[Field] | null;
  getIsCurrentChallenge: (challenge: PhoneChallenge) => boolean;
  setPhoneSubmitted: (params: { challenge: PhoneChallenge; phoneNationalNumber: string; resendAfter: number }) => void;
  setPhoneAlreadyRegistered: (phoneNationalNumber: string) => void;
  setResendAfter: (challenge: PhoneChallenge, resendAfter: number) => void;
  replaceRecoveryChallenge: (challenge: RecoveryPhoneChallenge, next: RecoveryPhoneChallenge, resendAfter: number) => void;
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
      if (!hasIdentityDraft(session) || shallowEqual(session.identity[field], value)) return state;
      return { session: { ...session, identity: { ...session.identity, [field]: value } } };
    });
  }

  return {
    session: EMPTY_SESSION,
    getGovernmentId: () => {
      const { session } = get();
      return hasIdentityDraft(session) && isValidUsSsnLast4(session.ssnLast4) ? createUsSsnLast4GovernmentId(session.ssnLast4) : null;
    },
    getIdentity: () => {
      const { session } = get();
      return hasIdentityDraft(session) ? createCashSetupIdentity(session.identity) : null;
    },
    getPersonalDetailsDraft: field => {
      const { session } = get();
      return hasIdentityDraft(session) ? session[field] : null;
    },
    getIsCurrentChallenge: challenge => {
      const { session } = get();
      return (session.status === 'phoneSubmitted' || session.status === 'recovery') && session.challenge === challenge;
    },
    setPhoneSubmitted: ({ challenge, phoneNationalNumber, resendAfter }) =>
      set({
        session:
          challenge.kind === 'recovery'
            ? {
                status: 'recovery',
                challenge,
                phoneNationalNumber,
                resendAfter,
                identity: EMPTY_IDENTITY,
                ssnLast4: '',
              }
            : { status: 'phoneSubmitted', challenge, phoneNationalNumber, resendAfter },
      }),
    setPhoneAlreadyRegistered: phoneNationalNumber => set({ session: { status: 'phoneAlreadyRegistered', phoneNationalNumber } }),
    setResendAfter: (challenge, resendAfter) =>
      set(state => {
        const { session } = state;
        if (
          (session.status !== 'phoneSubmitted' && session.status !== 'recovery') ||
          session.challenge !== challenge ||
          session.resendAfter === resendAfter
        )
          return state;
        return { session: { ...session, resendAfter } };
      }),
    replaceRecoveryChallenge: (challenge, next, resendAfter) =>
      set(state => {
        const { session } = state;
        if (session.status !== 'recovery' || session.challenge !== challenge) return state;
        return { session: { ...session, challenge: next, resendAfter } };
      }),
    setPhoneVerified: (challenge, { bootstrapToken, expiresAt }) =>
      set(state => {
        const { session } = state;
        if ((session.status !== 'phoneSubmitted' && session.status !== 'recovery') || session.challenge !== challenge) return state;
        return {
          session: {
            status: 'phoneVerified',
            source: challenge.kind,
            phoneNationalNumber: session.phoneNationalNumber,
            bootstrapToken,
            bootstrapTokenExpiresAt: expiresAt,
            identity: session.status === 'recovery' ? session.identity : EMPTY_IDENTITY,
            ssnLast4: session.status === 'recovery' ? session.ssnLast4 : '',
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
        if (!hasIdentityDraft(session) || session.ssnLast4 === ssnLast4) return state;
        return { session: { ...session, ssnLast4 } };
      }),
    reset: () => set(state => (state.session === EMPTY_SESSION ? state : { session: EMPTY_SESSION })),
  };
});

export function selectIsPhoneVerified(state: CashSetupSessionStore): boolean {
  return state.session.status === 'phoneVerified' && state.session.bootstrapTokenExpiresAt > Date.now();
}

export function selectResendAfter(state: CashSetupSessionStore): number | null {
  return state.session.status === 'phoneSubmitted' || state.session.status === 'recovery' ? state.session.resendAfter : null;
}

function hasIdentityDraft(session: CashSetupSession): session is RecoveryCashSetupSession | VerifiedCashSetupSession {
  return session.status === 'recovery' || session.status === 'phoneVerified';
}
