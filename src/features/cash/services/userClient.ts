import { IS_TESTING } from 'react-native-dotenv';

import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

import { getCashPlatformClient } from './rampClient';

export const US_COUNTRY_CALLING_CODE = '1';

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

  const { data } = await getCashPlatformClient().post<CreateUserWithPhoneResponse>('/signup/CreateUserWithPhone', {
    phone: { countryCode: US_COUNTRY_CALLING_CODE, nationalNumber },
  });
  // TODO: remove `resendAfter` harcode once backend returns it
  return { ...data, resendAfter: Date.now() + time.seconds(30) };
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

  const { data } = await getCashPlatformClient().post<{ bootstrapToken: string; expiresIn: string }>('/signup/VerifyPhone', {
    userId,
    code,
  });
  const expiresInSeconds = Number(data.expiresIn.replace(/s$/, ''));
  return { bootstrapToken: data.bootstrapToken, expiresAt: Date.now() + expiresInSeconds * 1000 };
}

export async function resendPhoneCode({ userId }: { userId: string }): Promise<ResendPhoneCodeResponse> {
  if (IS_TESTING === 'true') return { resendAfter: Date.now() + time.seconds(30) };

  const { data } = await getCashPlatformClient().post<ResendPhoneCodeResponse>('/signup/ResendPhoneCode', { userId });
  // TODO: remove `resendAfter` harcode once backend returns it
  return { ...data, resendAfter: Date.now() + time.seconds(30) };
}
