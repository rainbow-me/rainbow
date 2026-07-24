import { IS_TESTING } from 'react-native-dotenv';

import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

import { type CashSetupDateOfBirth, type CashSetupGovernmentId, type CashSetupIdentity } from '../stores/cashSetupSessionStore';
import { getCashPlatformClient } from './rampClient';

export const US_COUNTRY_CALLING_CODE = '1';

const BOOTSTRAP_TOKEN_PATTERN = /^bst_.+/;
// ProtoJSON encoding of google.protobuf.Duration, e.g. "600s" or "0.5s".
const PROTO_DURATION_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,9})?s$/;

function parseBootstrapCredential({ bootstrapToken, expiresIn }: { bootstrapToken: unknown; expiresIn: unknown }): {
  bootstrapToken: string;
  expiresAt: number;
} {
  if (typeof bootstrapToken !== 'string' || !BOOTSTRAP_TOKEN_PATTERN.test(bootstrapToken)) {
    throw new Error('UserService returned an invalid bootstrap token');
  }
  if (typeof expiresIn !== 'string' || !PROTO_DURATION_PATTERN.test(expiresIn)) {
    throw new Error('UserService returned an invalid bootstrap token expiry');
  }
  const expiresInMs = Number(expiresIn.slice(0, -1)) * 1000;
  if (expiresInMs <= 0 || expiresInMs > Number.MAX_SAFE_INTEGER - Date.now()) {
    throw new Error('UserService returned an invalid bootstrap token expiry');
  }
  return { bootstrapToken, expiresAt: Date.now() + expiresInMs };
}

// Absent means a resend is already allowed; the server enforces the real rate
// limit, so a malformed duration degrades to no client-side cooldown.
function parseResendAfter(resendAfter: unknown): number {
  if (typeof resendAfter === 'string' && PROTO_DURATION_PATTERN.test(resendAfter)) {
    return Date.now() + Number(resendAfter.slice(0, -1)) * 1000;
  }
  return Date.now();
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

function buildAuthenticatedHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

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
    return { passkeyId: 'e2e-passkey-id', publicKeyOptionsJson: '{}' };
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
