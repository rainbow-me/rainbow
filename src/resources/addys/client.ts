import { RainbowFetchClient } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { ADDYS_API_KEY, ADDYS_BASE_URL } from 'react-native-dotenv';

let addysHttp: RainbowFetchClient | undefined;

export const getAddysHttpClient = ({ abortController }: { abortController?: AbortController | null } = {}) => {
  const clientUrl = addysHttp?.baseURL;
  const baseUrl = ADDYS_BASE_URL;
  if (!addysHttp || clientUrl !== baseUrl) {
    addysHttp = new RainbowFetchClient({
      baseURL: ADDYS_BASE_URL,
      abortController,
      headers: {
        Authorization: `Bearer ${ADDYS_API_KEY}`,
      },
      timeout: time.seconds(30),
    });
  }

  return addysHttp;
};

/**
 * Returns `true` if in an addys staging environment, else `false`.
 */
export function isStaging(): boolean {
  return ADDYS_BASE_URL.includes('.s.');
}
