import * as Sentry from '@sentry/react-native';
import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress } from '@/entities';
import {
  getSignatureForSigningWalletAndCreateSignatureIfNeeded,
  signWithSigningWallet,
} from '@/helpers/signingWallet';
import logger from '@/utils/logger';

export enum PreferenceActionType {
  update = 'update',
  remove = 'remove',
  wipe = 'wipe',
  init = 'init',
}

export interface PreferencesResponse {
  success: boolean;
  reason: string;
  data?: Record<string, unknown> | undefined;
}

export const PREFS_ENDPOINT = 'https://api.rainbow.me';

const preferencesAPI = new RainbowFetchClient({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

export async function setPreference(
  action: PreferenceActionType,
  key: string,
  address: EthereumAddress,
  value?: any | undefined
): Promise<boolean> {
  try {
    const signature = await getSignatureForSigningWalletAndCreateSignatureIfNeeded(
      address
    );
    if (!signature) {
      return false;
    }
    const objToSign = {
      action,
      address,
      key,
      value,
    };
    const message = JSON.stringify(objToSign);
    const signature2 = await signWithSigningWallet(message);
    logger.log('☁️  SENDING ', message);
    const response = await preferencesAPI.post(`${PREFS_ENDPOINT}/${key}`, {
      message,
      signature,
      signature2,
    });
    const responseData: PreferencesResponse = response.data as PreferencesResponse;
    logger.log('☁️  RESPONSE', {
      reason: responseData?.reason,
      success: responseData?.success,
    });
    return responseData?.success;
  } catch (e) {
    Sentry.captureException(
      new Error(`Preferences API failed to set preference`),
      { extra: { preferenceKey: key } }
    );
    logger.log('☁️  error setting pref', e);
    return false;
  }
}

export async function getPreference(
  key: string,
  address: EthereumAddress
): Promise<any | null> {
  try {
    const response = await preferencesAPI.get(`${PREFS_ENDPOINT}/${key}`, {
      params: { address },
    });
    const responseData: PreferencesResponse = response.data as PreferencesResponse;
    logger.log('☁️  RESPONSE', {
      reason: responseData?.reason,
      success: responseData?.success,
    });
    return responseData?.data || null;
  } catch (e) {
    Sentry.captureException(
      new Error(`Preferences API failed to get preference`),
      { extra: { preferenceKey: key } }
    );
    logger.log('☁️  error getting pref', e);
    return null;
  }
}
