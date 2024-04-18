import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress } from '@/entities';
import { getSignatureForSigningWalletAndCreateSignatureIfNeeded, signWithSigningWallet } from '@/helpers/signingWallet';
import { logger } from '@/logger';
import { Address } from 'viem';

export const PREFS_ENDPOINT = 'https://api.rainbow.me';
const preferencesAPI = new RainbowFetchClient({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

export enum PreferenceActionType {
  update = 'update',
  remove = 'remove',
  wipe = 'wipe',
  init = 'init',
}

export enum PreferenceKeys {
  showcase = 'showcase',
  profile = 'profile',
}

type TokenContract = Address;
type TokenId = string;

type TokenContractWithId = `${TokenContract}_${TokenId}`;

type HiddenPreferencesData = {
  hidden: {
    ids: [];
  };
};

type ShowcasePreferencesData = {
  showcase: {
    ids: TokenContractWithId[];
  };
};

type Profile = {
  accountColor: string;
  accountSymbol: string | null;
};

type ProfilePreferencesData = {
  profile: Profile;
};

type PreferencesDataMap = {
  showcase: ShowcasePreferencesData;
  profile: ProfilePreferencesData;
  hidden: HiddenPreferencesData;
};

type PayloadMap = {
  showcase: string[];
  profile: Profile;
  hidden: string[];
};

type PreferencesResponse<T extends keyof PreferencesDataMap> = {
  success: boolean;
  data?: T extends keyof PreferencesDataMap ? PreferencesDataMap[T] : never;
  reason?: string;
};

export async function setPreference<K extends keyof PreferencesDataMap>(
  action: PreferenceActionType,
  key: K,
  address: EthereumAddress,
  value?: PayloadMap[K]
): Promise<boolean> {
  try {
    const signature = await getSignatureForSigningWalletAndCreateSignatureIfNeeded(address);
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
    logger.debug('☁️  SENDING ', { message });
    const { data } = await preferencesAPI.post<PreferencesResponse<K>>(`${PREFS_ENDPOINT}/${key}`, {
      message,
      signature,
      signature2,
    });
    logger.debug('☁️  RESPONSE', {
      reason: data?.reason,
      success: data?.success,
    });

    if (!data.data) {
      throw new Error('Failed to set preference');
    }

    return data?.success;
  } catch (e) {
    logger.warn(`Preferences API failed to set preference`, {
      preferenceKey: key,
    });
    return false;
  }
}

export async function getPreference<K extends keyof PreferencesDataMap>(
  key: K,
  address: EthereumAddress
): Promise<PreferencesDataMap[K] | null> {
  try {
    const { data } = await preferencesAPI.get<PreferencesResponse<K>>(`${PREFS_ENDPOINT}/${key}`, {
      params: { address },
    });
    logger.debug('☁️  RESPONSE', {
      reason: data?.reason,
      success: data?.success,
    });

    if (!data.data) {
      return null;
    }

    return data.data;
  } catch (e) {
    logger.warn(`Preferences API failed to get preference`, {
      preferenceKey: key,
    });
    return null;
  }
}
