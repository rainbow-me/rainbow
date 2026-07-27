import { IS_TESTING } from 'react-native-dotenv';

import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

import { type CashSetupDateOfBirth, type CashSetupGovernmentId, type CashSetupIdentity } from '../stores/cashSetupSessionStore';
import { buildAuthenticatedHeader, getCashPlatformClient } from './cashPlatformClient';

export const US_COUNTRY_CALLING_CODE = '1';

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

type CreateUserWithPhoneResponse = {
  userId: string;
  resendAfter: number;
};

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
};

type FinishAddPasskeyParams = {
  bootstrapToken: string;
  passkeyId: string;
  /** WebAuthn attestation, JSON-encoded. */
  credentialCreationJson: string;
  passkeyName: string;
};

type GetUserStatusResponse = {
  status: {
    kyc: {
      status: KycStatus;
    };
  };
};

export async function createUserWithPhone({ nationalNumber }: { nationalNumber: string }): Promise<CreateUserWithPhoneResponse> {
  if (IS_TESTING === 'true') {
    await delay(time.seconds(1));
    return { userId: 'e2e-user-id', resendAfter: Date.now() + time.seconds(30) };
  }

  const { data } = await getCashPlatformClient().post<{ userId: string; resendAfter: unknown }>('/signup/CreateUserWithPhone', {
    phone: { countryCode: US_COUNTRY_CALLING_CODE, nationalNumber },
  });
  return { userId: data.userId, resendAfter: parseResendAfter(data.resendAfter) };
}

export async function verifyPhone({
  userId,
  code,
}: {
  userId: string;
  code: string;
}): Promise<{ bootstrapToken: string; expiresAt: number }> {
  if (IS_TESTING === 'true') {
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
  if (IS_TESTING === 'true') return { resendAfter: Date.now() + time.seconds(30) };

  const { data } = await getCashPlatformClient().post<{ resendAfter: unknown }>('/signup/ResendPhoneCode', { userId });
  return { resendAfter: parseResendAfter(data.resendAfter) };
}

export async function submitOnboarding({
  bootstrapToken,
  countryCode,
  identity,
  governmentId,
}: SubmitOnboardingParams): Promise<SubmitOnboardingResponse> {
  if (IS_TESTING === 'true') {
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
  if (IS_TESTING === 'true') {
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
  if (IS_TESTING === 'true') {
    await delay(time.seconds(1));
    return;
  }

  await getCashPlatformClient().post(
    '/passkeys/FinishAddPasskey',
    { passkeyId, credentialCreationJson, passkeyName },
    { headers: buildAuthenticatedHeader(bootstrapToken) }
  );
}

export async function startLogin({ userId }: { userId: string }): Promise<StartLoginResponse> {
  if (IS_TESTING === 'true') {
    await delay(time.seconds(1));
    return { sessionId: 'e2e-session-id', sessionToken: 'e2e-session-token', publicKeyOptionsJson: '{}' };
  }

  const { data } = await getCashPlatformClient().post<StartLoginResponse>('/auth/StartLogin', { userId });
  return { sessionId: data.sessionId, sessionToken: data.sessionToken, publicKeyOptionsJson: data.publicKeyOptionsJson };
}

export async function finishLogin({ sessionId, sessionToken, credentialAssertionJson }: FinishLoginParams): Promise<FinishLoginResponse> {
  if (IS_TESTING === 'true') {
    await delay(time.seconds(1));
    return { sessionId, sessionToken };
  }

  const { data } = await getCashPlatformClient().post<FinishLoginResponse>('/auth/FinishLogin', {
    sessionId,
    sessionToken,
    credentialAssertionJson,
  });
  return { sessionId: data.sessionId, sessionToken: data.sessionToken };
}

export async function finalizeAuth({
  sessionId,
  sessionToken,
}: {
  sessionId: string;
  sessionToken: string;
}): Promise<{ accessToken: string; expiresAt: number }> {
  if (IS_TESTING === 'true') {
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
  if (IS_TESTING === 'true') {
    await delay(time.seconds(1));
    return { kycStatus: KycStatus.Approved };
  }

  const { data } = await getCashPlatformClient().get<GetUserStatusResponse>('/status/GetUserStatus', {
    headers: buildAuthenticatedHeader(bootstrapToken),
  });
  return { kycStatus: data.status.kyc.status };
}
