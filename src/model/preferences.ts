import { Wallet } from '@ethersproject/wallet';
import axios from 'axios';

export enum PreferenceActionType {
  add = 'add',
  remove = 'remove',
  update = 'update',
}

export interface PreferencesResponse {
  success: boolean;
  data?: Object;
}

const PREFS_ENDPOINT = 'http://localhost:8080/api/preferences';

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

    console.log({ action, key, value, wallet });
    console.log({ objToSign });

    const signature = await wallet.signMessage(message);
    console.log(signature);
    const apiCall =
      action === 'add'
        ? preferencesAPI.post
        : action === 'update'
        ? preferencesAPI.patch
        : preferencesAPI.delete;

    const response: PreferencesResponse = await apiCall(PREFS_ENDPOINT, {
      message,
      signature,
    });
    return response.success;
  } catch (e) {
    console.log('error setting pref', e);
    return false;
  }
}

export async function getPreference(
  key: string,
  wallet: Wallet
): Promise<Object | undefined> {
  const auth = { auth: true };
  const msg = await wallet.signMessage(JSON.stringify(auth));
  const response: PreferencesResponse = await preferencesAPI.get(
    PREFS_ENDPOINT,
    { params: msg }
  );
  return response.data;
}
