import { Wallet } from '@ethersproject/wallet';
import axios from 'axios';
import logger from 'logger';

export enum PreferenceActionType {
  add = 'add',
  remove = 'remove',
  wipe = 'wipe',
  init = 'init',
}

export interface PreferencesResponse {
  success: boolean;
  data?: Object;
}

const PREFS_ENDPOINT =
  'https://us-central1-rainbow-me.cloudfunctions.net/showcase';

const preferencesAPI = axios.create({
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

export async function setPreference(
  action: PreferenceActionType,
  key: string,
  value: Object,
  wallet: Wallet
): Promise<boolean> {
  try {
    const address = await wallet.getAddress();
    const objToSign = {
      action,
      address,
      key,
      value,
    };
    const message = JSON.stringify(objToSign);
    const signature = await wallet.signMessage(message);
    const response: PreferencesResponse = await preferencesAPI.post(
      PREFS_ENDPOINT,
      {
        message,
        signature,
      }
    );
    return response.success;
  } catch (e) {
    logger.log('error setting pref', e);
    return false;
  }
}
