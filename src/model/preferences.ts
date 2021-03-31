import { Wallet } from '@ethersproject/wallet';
import axios from 'axios';
import logger from 'logger';

export enum PreferenceActionType {
  update = 'update',
  remove = 'remove',
  wipe = 'wipe',
  init = 'init',
}

export interface PreferencesResponse {
  success: boolean;
  data?: Object;
}

const PREFS_ENDPOINT = 'https://us-central1-rainbow-me.cloudfunctions.net';

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
  wallet: Wallet,
  value?: Object | undefined
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
    logger.log('SENDING ', message);
    const response: PreferencesResponse = await preferencesAPI.post(
      `${PREFS_ENDPOINT}/${key}`,
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
