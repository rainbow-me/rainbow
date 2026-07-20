import { IS_TESTING } from 'react-native-dotenv';

import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

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

type CreateUserWithPhoneResponse = {
  userId: string;
  resendAfter: number;
};

type ResendPhoneCodeResponse = {
  resendAfter: number;
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
