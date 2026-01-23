import { PlatformResponse } from '@/features/rnbw-rewards/types/platformResponseTypes';
import { RainbowFetchResponse } from '@/rainbow-fetch';

/**
 * This should in theory not be possible, and is only a sanity check. It should be replaced with Zod schema parsing if we decide we want to use Zod for this.
 */
export function getPlatformResult<T>(response: RainbowFetchResponse<PlatformResponse<T>>, context: string): T {
  if (!response?.data) {
    throw new Error(`[${context}]: response is missing data`);
  }
  if (response.data.result == null) {
    throw new Error(`[${context}]: response is missing result`);
  }
  return response.data.result;
}
