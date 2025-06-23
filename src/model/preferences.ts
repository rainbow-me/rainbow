import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress } from '@/entities';
import { getSignatureForSigningWalletAndCreateSignatureIfNeeded, signWithSigningWallet } from '@/helpers/signingWallet';
import { logger } from '@/logger';
import { Network } from '@/state/backendNetworks/types';
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
  address = 'address',
}

type TokenContract = Address;
type TokenId = string;

type TokenContractWithId = `${TokenContract}_${TokenId}`;

type HiddenContractWithNetworkAndId = `${Network}_${TokenContract}_${TokenId}`;

type HiddenPreferencesData = {
  hidden: {
    ids: HiddenContractWithNetworkAndId[];
  };
};

type ShowcasePreferencesData = {
  showcase: {
    ids: TokenContractWithId[];
  };
};

export type AddressPreferencesData = {
  showcase: ShowcasePreferencesData['showcase'];
  profile: ProfilePreferencesData['profile'];
  hidden: HiddenPreferencesData;
  reverseEns?: string;
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
  address: AddressPreferencesData;
};

type PayloadMap = {
  showcase: string[];
  profile: Profile;
  hidden: string[];
  address: string;
};

type PreferencesResponse<T extends keyof PreferencesDataMap> = {
  success: boolean;
  data?: T extends keyof PreferencesDataMap ? PreferencesDataMap[T] : never;
  reason?: string;
};

export async function setPreference<K extends keyof Omit<PreferencesDataMap, 'address'>>(
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

    logger.debug(`[preferences]: ☁️  SENDING `, { message });
    const { data } = await preferencesAPI.post<PreferencesResponse<K>>(`${PREFS_ENDPOINT}/${key}`, {
      message,
      signature,
      signature2,
    });
    logger.debug(`[preferences]: ☁️  RESPONSE`, {
      reason: data?.reason,
      success: data?.success,
    });

    if (!data?.success) {
      throw new Error('Failed to set preference');
    }

    return data?.success;
  } catch (e) {
    logger.warn(`[preferences]: Preferences API failed to set preference`, {
      preferenceKey: key,
    });
    return false;
  }
}

export async function getPreference<K extends keyof PreferencesDataMap>(
  key: K,
  address: EthereumAddress
): Promise<PreferencesDataMap[K] | null | undefined> {
  try {
    const { data } = await preferencesAPI.get<PreferencesResponse<K>>(`${PREFS_ENDPOINT}/${key}`, {
      params: { address },
    });
    console.log('data', JSON.stringify(data, null, 2));
    logger.debug(`[preferences]: ☁️  RESPONSE`, {
      reason: data?.reason,
      success: data?.success,
    });

    if (!data?.success) {
      return null;
    }

    return data.data;
  } catch (e) {
    logger.warn(`[preferences]: Preferences API failed to get preference`, {
      preferenceKey: key,
      error: e,
    });
    return null;
  }
}
