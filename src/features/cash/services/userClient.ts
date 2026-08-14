import { IS_CASH_MOCK } from '@/env';
import { time } from '@/framework/core/utils/time';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { delay } from '@/utils/delay';

import { US_COUNTRY_CALLING_CODE } from '../utils/phoneNumber';
import { buildAuthenticatedHeader, getCashPlatformClient } from './cashPlatformClient';
import { type CashSetupDateOfBirth, type CashSetupGovernmentId, type CashSetupIdentity } from './cashSetupIdentityService';

const PHONE_ALREADY_REGISTERED = 1300;
const REGISTERED_WITH_PASSKEY = 1303;
const REGISTERED_WITHOUT_PASSKEY = 1304;
const RECOVERY_SESSION_INVALID = 1320;
const RECOVERY_CODE_INVALID = 1321;
const SIGNUP_ALREADY_COMPLETE = 1322;
const SIGNUP_INCOMPLETE = 1323;
const ACCESS_BLOCKED = 1340;
const IDENTITY_MISMATCH = 403;

const MOCK_REGISTERED_WITHOUT_PASSKEY_NUMBER = '5550001304';
const MOCK_REGISTERED_WITH_PASSKEY_NUMBER = '5550001303';
const MOCK_RESUME_KYC_PENDING_NUMBER = '5550001305';
const MOCK_SIGNUP_ALREADY_COMPLETE_CODE = '001322';
// The pending account's KYC status rides its resume handles, so the mocks stay stateless.
const MOCK_KYC_PENDING_RESUME_ID = 'e2e-resume-id-kyc-pending';
const MOCK_KYC_PENDING_BOOTSTRAP_TOKEN = 'bst_e2e_kyc_pending';

function getPlatformErrorCode(error: unknown): number | null {
  if (!(error instanceof RainbowFetchError)) return null;
  const code = error.responseBody?.code;
  return typeof code === 'number' ? code : null;
}

const BOOTSTRAP_TOKEN_PATTERN = /^bst_.+/;
// ProtoJSON encoding of google.protobuf.Duration, e.g. "600s" or "0.5s".
const PROTO_DURATION_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,9})?s$/;

function parseProtoDurationMs(value: unknown): number | null {
  if (typeof value !== 'string' || !PROTO_DURATION_PATTERN.test(value)) return null;
  return Number(value.slice(0, -1)) * 1000;
}

function parseExpiresAt(expiresIn: unknown, errorMessage: string): number {
  const expiresInMs = parseProtoDurationMs(expiresIn);
  if (expiresInMs == null || expiresInMs <= 0 || expiresInMs > Number.MAX_SAFE_INTEGER - Date.now()) {
    throw new Error(errorMessage);
  }
  return Date.now() + expiresInMs;
}

function parseBootstrapCredential({ bootstrapToken, expiresIn }: { bootstrapToken: unknown; expiresIn: unknown }): {
  bootstrapToken: string;
  expiresAt: number;
} {
  if (typeof bootstrapToken !== 'string' || !BOOTSTRAP_TOKEN_PATTERN.test(bootstrapToken)) {
    throw new Error('UserService returned an invalid bootstrap token');
  }
  return { bootstrapToken, expiresAt: parseExpiresAt(expiresIn, 'UserService returned an invalid bootstrap token expiry') };
}

function parseAccessCredential({ accessToken, expiresIn }: { accessToken: unknown; expiresIn: unknown }): {
  accessToken: string;
  expiresAt: number;
} {
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('UserService returned an invalid access token');
  }
  return { accessToken, expiresAt: parseExpiresAt(expiresIn, 'UserService returned an invalid access token expiry') };
}

// Absent means a resend is already allowed; the server enforces the real rate
// limit, so a malformed duration degrades to no client-side cooldown.
function parseResendAfter(resendAfter: unknown): number {
  return Date.now() + (parseProtoDurationMs(resendAfter) ?? 0);
}

export enum KycStatus {
  Unspecified = 'KYC_STATUS_UNSPECIFIED',
  Pending = 'KYC_STATUS_PENDING',
  Approved = 'KYC_STATUS_APPROVED',
  Rejected = 'KYC_STATUS_REJECTED',
  Review = 'KYC_STATUS_REVIEW',
}

// Pending and Review are one state to the app: the provider has not decided yet.
export type KycOutcome = 'reviewing' | 'approved' | 'rejected';

export type CreateUserWithPhoneResult =
  | { outcome: 'created'; userId: string; resendAfter: number }
  | { outcome: 'registeredWithoutPasskey' }
  | { outcome: 'registeredWithPasskey' }
  | { outcome: 'alreadyRegistered' };

type ResendPhoneCodeResponse = {
  resendAfter: number;
};

type SubmitOnboardingParams = {
  bootstrapToken: string;
  /** Country of residence, ISO 3166-1 alpha-2. */
  countryCode: string;
  identity: CashSetupIdentity;
  governmentId: CashSetupGovernmentId;
};

type SubmitOnboardingRequest = {
  countryCode: string;
  legalName: {
    firstName: string;
    lastName: string;
  };
  dateOfBirth: CashSetupDateOfBirth;
  governmentId: CashSetupGovernmentId;
};

type SubmitOnboardingResponse = {
  kycStatus: KycStatus;
};

type GetUserStatusParams = {
  bootstrapToken: string;
};

type AddPasskeyResponse = {
  passkeyId: string;
  /** WebAuthn PublicKeyCredentialCreationOptions, JSON-encoded. */
  publicKeyOptionsJson: string;
  userId: string;
};

/** Exactly one identifier: the stored account UUID, or the registered phone as a fallback. */
export type StartLoginParams = { userId: string } | { phone: { countryCode: string; nationalNumber: string } };

type StartLoginResponse = {
  sessionId: string;
  sessionToken: string;
  /** WebAuthn PublicKeyCredentialRequestOptions, JSON-encoded. */
  publicKeyOptionsJson: string;
};

type FinishLoginParams = {
  sessionId: string;
  sessionToken: string;
  /** WebAuthn assertion, JSON-encoded. */
  credentialAssertionJson: string;
};

type FinishLoginResponse = {
  sessionId: string;
  sessionToken: string;
  userId: string;
};

type FinishAddPasskeyParams = {
  bootstrapToken: string;
  passkeyId: string;
  /** WebAuthn attestation, JSON-encoded. */
  credentialCreationJson: string;
  passkeyName: string;
};

type FinishRecoveryParams = {
  recoveryId: string;
  code: string;
  identity: CashSetupIdentity;
  governmentId: CashSetupGovernmentId;
};

type GetUserStatusResponse = {
  status: {
    kyc: {
      status: KycStatus;
    };
  };
};

export async function createUserWithPhone({ nationalNumber }: { nationalNumber: string }): Promise<CreateUserWithPhoneResult> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    if (nationalNumber === MOCK_REGISTERED_WITHOUT_PASSKEY_NUMBER || nationalNumber === MOCK_RESUME_KYC_PENDING_NUMBER)
      return { outcome: 'registeredWithoutPasskey' };
    if (nationalNumber === MOCK_REGISTERED_WITH_PASSKEY_NUMBER) return { outcome: 'registeredWithPasskey' };
    return { outcome: 'created', userId: 'e2e-user-id', resendAfter: Date.now() + time.seconds(30) };
  }

  try {
    const { data } = await getCashPlatformClient().post<{ userId: string; resendAfter: unknown }>('/signup/CreateUserWithPhone', {
      phone: { countryCode: US_COUNTRY_CALLING_CODE, nationalNumber },
    });
    return { outcome: 'created', userId: data.userId, resendAfter: parseResendAfter(data.resendAfter) };
  } catch (e) {
    switch (getPlatformErrorCode(e)) {
      case REGISTERED_WITHOUT_PASSKEY:
        return { outcome: 'registeredWithoutPasskey' };
      case REGISTERED_WITH_PASSKEY:
        return { outcome: 'registeredWithPasskey' };
      case PHONE_ALREADY_REGISTERED:
        return { outcome: 'alreadyRegistered' };
      default:
        throw e;
    }
  }
}

export async function verifyPhone({
  userId,
  code,
}: {
  userId: string;
  code: string;
}): Promise<{ bootstrapToken: string; expiresAt: number }> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    if (code !== '000000') throw new Error('Invalid verification code');
    return { bootstrapToken: 'bst_e2e', expiresAt: Date.now() + time.hours(1) };
  }

  const { data } = await getCashPlatformClient().post<{ bootstrapToken: unknown; expiresIn: unknown }>('/signup/VerifyPhone', {
    userId,
    code,
  });
  return parseBootstrapCredential(data);
}

export async function resendPhoneCode({ userId }: { userId: string }): Promise<ResendPhoneCodeResponse> {
  if (IS_CASH_MOCK) return { resendAfter: Date.now() + time.seconds(30) };

  const { data } = await getCashPlatformClient().post<{ resendAfter: unknown }>('/signup/ResendPhoneCode', { userId });
  return { resendAfter: parseResendAfter(data.resendAfter) };
}

export async function submitOnboarding({
  bootstrapToken,
  countryCode,
  identity,
  governmentId,
}: SubmitOnboardingParams): Promise<SubmitOnboardingResponse> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return { kycStatus: KycStatus.Approved };
  }

  const request: SubmitOnboardingRequest = {
    countryCode,
    legalName: { firstName: identity.firstName, lastName: identity.lastName },
    dateOfBirth: identity.dateOfBirth,
    governmentId,
  };
  const { data } = await getCashPlatformClient().post<SubmitOnboardingResponse>('/onboarding/SubmitOnboarding', request, {
    headers: buildAuthenticatedHeader(bootstrapToken),
  });
  return data;
}

export async function addPasskey({ bootstrapToken }: { bootstrapToken: string }): Promise<AddPasskeyResponse> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return { passkeyId: 'e2e-passkey-id', publicKeyOptionsJson: '{}', userId: 'e2e-user-id' };
  }

  const { data } = await getCashPlatformClient().post<AddPasskeyResponse>(
    '/passkeys/AddPasskey',
    {},
    { headers: buildAuthenticatedHeader(bootstrapToken) }
  );
  return data;
}

export async function finishAddPasskey({
  bootstrapToken,
  passkeyId,
  credentialCreationJson,
  passkeyName,
}: FinishAddPasskeyParams): Promise<void> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return;
  }

  await getCashPlatformClient().post(
    '/passkeys/FinishAddPasskey',
    { passkeyId, credentialCreationJson, passkeyName },
    { headers: buildAuthenticatedHeader(bootstrapToken) }
  );
}

export async function startLogin(identifier: StartLoginParams): Promise<StartLoginResponse> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return { sessionId: 'e2e-session-id', sessionToken: 'e2e-session-token', publicKeyOptionsJson: '{}' };
  }

  const { data } = await getCashPlatformClient().post<StartLoginResponse>('/auth/StartLogin', identifier);
  return { sessionId: data.sessionId, sessionToken: data.sessionToken, publicKeyOptionsJson: data.publicKeyOptionsJson };
}

export async function finishLogin({ sessionId, sessionToken, credentialAssertionJson }: FinishLoginParams): Promise<FinishLoginResponse> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return { sessionId, sessionToken, userId: 'e2e-user-id' };
  }

  const { data } = await getCashPlatformClient().post<FinishLoginResponse>('/auth/FinishLogin', {
    sessionId,
    sessionToken,
    credentialAssertionJson,
  });
  return { sessionId: data.sessionId, sessionToken: data.sessionToken, userId: data.userId };
}

export async function finalizeAuth({
  sessionId,
  sessionToken,
}: {
  sessionId: string;
  sessionToken: string;
}): Promise<{ accessToken: string; expiresAt: number }> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return { accessToken: 'e2e-access-token', expiresAt: Date.now() + time.hours(1) };
  }

  const { data } = await getCashPlatformClient().post<{ accessToken: unknown; expiresIn: unknown }>('/auth/FinalizeAuth', {
    sessionId,
    sessionToken,
  });
  return parseAccessCredential(data);
}

export async function getUserStatus({ bootstrapToken }: GetUserStatusParams): Promise<{ kycStatus: KycStatus }> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    return { kycStatus: bootstrapToken === MOCK_KYC_PENDING_BOOTSTRAP_TOKEN ? KycStatus.Pending : KycStatus.Approved };
  }

  const { data } = await getCashPlatformClient().get<GetUserStatusResponse>('/status/GetUserStatus', {
    headers: buildAuthenticatedHeader(bootstrapToken),
  });
  return { kycStatus: data.status.kyc.status };
}

export async function startSignupResume({
  nationalNumber,
}: {
  nationalNumber: string;
}): Promise<{ resumeId: string; resendAfter: number }> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    const resumeId = nationalNumber === MOCK_RESUME_KYC_PENDING_NUMBER ? MOCK_KYC_PENDING_RESUME_ID : 'e2e-resume-id';
    return { resumeId, resendAfter: Date.now() + time.seconds(30) };
  }

  const { data } = await getCashPlatformClient().post<{ resumeId: string; resendAfter: unknown }>('/signup/resume/StartSignupResume', {
    phone: { countryCode: US_COUNTRY_CALLING_CODE, nationalNumber },
  });
  return { resumeId: data.resumeId, resendAfter: parseResendAfter(data.resendAfter) };
}

export async function startRecovery({ nationalNumber }: { nationalNumber: string }): Promise<{ recoveryId: string; resendAfter: number }> {
  if (IS_TESTING === 'true') {
    await delay(time.seconds(1));
    return { recoveryId: 'e2e-recovery-id', resendAfter: Date.now() + time.seconds(30) };
  }

  const { data } = await getCashPlatformClient().post<{
    recoveryId: string;
    methods?: string[];
    resendAfter: unknown;
  }>('/recovery/StartRecovery', {
    phone: { countryCode: US_COUNTRY_CALLING_CODE, nationalNumber },
  });
  if (!data.methods?.includes('RECOVERY_METHOD_PERSONAL_DETAILS')) {
    throw new Error('UserService returned no supported recovery method');
  }
  return { recoveryId: data.recoveryId, resendAfter: parseResendAfter(data.resendAfter) };
}

export type FinishRecoveryResult =
  | { outcome: 'recovered'; bootstrapToken: string; expiresAt: number }
  | { outcome: 'identityMismatch' | 'sessionInvalid' | 'codeInvalid' | 'signupIncomplete' | 'accessBlocked' };

export async function finishRecovery({ recoveryId, code, identity, governmentId }: FinishRecoveryParams): Promise<FinishRecoveryResult> {
  if (IS_TESTING === 'true') {
    await delay(time.seconds(1));
    if (code !== '000000') return { outcome: 'codeInvalid' };
    return { outcome: 'recovered', bootstrapToken: 'bst_e2e', expiresAt: Date.now() + time.hours(1) };
  }

  try {
    const { data } = await getCashPlatformClient().post<{ bootstrapToken: unknown; expiresIn: unknown }>('/recovery/FinishRecovery', {
      recoveryId,
      code,
      personalDetails: {
        countryCode: governmentId.countryCode,
        legalName: { firstName: identity.firstName, lastName: identity.lastName },
        dateOfBirth: identity.dateOfBirth,
        governmentId,
      },
    });
    return { outcome: 'recovered', ...parseBootstrapCredential(data) };
  } catch (e) {
    switch (getPlatformErrorCode(e)) {
      case IDENTITY_MISMATCH:
        return { outcome: 'identityMismatch' };
      case RECOVERY_SESSION_INVALID:
        return { outcome: 'sessionInvalid' };
      case RECOVERY_CODE_INVALID:
        return { outcome: 'codeInvalid' };
      case SIGNUP_INCOMPLETE:
        return { outcome: 'signupIncomplete' };
      case ACCESS_BLOCKED:
        return { outcome: 'accessBlocked' };
      default:
        throw e;
    }
  }
}

export type FinishSignupResumeResult =
  | { outcome: 'verified'; bootstrapToken: string; expiresAt: number }
  | { outcome: 'signupAlreadyComplete' };

export async function finishSignupResume({ resumeId, code }: { resumeId: string; code: string }): Promise<FinishSignupResumeResult> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(1));
    if (code === MOCK_SIGNUP_ALREADY_COMPLETE_CODE) return { outcome: 'signupAlreadyComplete' };
    if (code !== '000000') throw new Error('Invalid verification code');
    const bootstrapToken = resumeId === MOCK_KYC_PENDING_RESUME_ID ? MOCK_KYC_PENDING_BOOTSTRAP_TOKEN : 'bst_e2e';
    return { outcome: 'verified', bootstrapToken, expiresAt: Date.now() + time.hours(1) };
  }

  try {
    const { data } = await getCashPlatformClient().post<{ bootstrapToken: unknown; expiresIn: unknown }>(
      '/signup/resume/FinishSignupResume',
      { resumeId, code }
    );
    return { outcome: 'verified', ...parseBootstrapCredential(data) };
  } catch (e) {
    if (getPlatformErrorCode(e) === SIGNUP_ALREADY_COMPLETE) return { outcome: 'signupAlreadyComplete' };
    throw e;
  }
}
