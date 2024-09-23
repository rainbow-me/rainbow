import { RainbowFetchClient } from '@/rainbow-fetch';
import { ActionPropsV2 } from '../references';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { RainbowError } from '@/logger';

const ADDYS_BASE_URL = 'https://addys.p.rainbow.me/v3';

const addysHttp = new RainbowFetchClient({
  baseURL: ADDYS_BASE_URL,
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

export async function claimSponsoredClaimable({ parameters }: ActionPropsV2<'claimSponsoredClaimableAction'>) {
  const { url, method } = parameters;

  const path = url.replace(ADDYS_BASE_URL, '');
  let response: { data: { success: boolean } };
  try {
    if (method === 'GET') {
      response = await addysHttp.get(path);
    } else {
      response = await addysHttp.post(path);
    }

    if (!response?.data?.success) {
      throw new RainbowError('[CLAIM-SPONSORED-CLAIMABLE]: failed to execute sponsored claim call');
    }
  } catch (e) {
    throw new RainbowError('[CLAIM-SPONSORED-CLAIMABLE]: failed to execute sponsored claim call');
  }

  return {
    nonce: null,
    hash: null,
  };
}
