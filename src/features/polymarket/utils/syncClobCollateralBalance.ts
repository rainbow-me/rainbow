import { AssetType } from '@polymarket/clob-client-v2';

import { getPolymarketClobClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { ensureError, logger } from '@/logger';

export async function syncClobCollateralBalance(): Promise<void> {
  try {
    const client = await getPolymarketClobClient();
    await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });
  } catch (e) {
    const error = ensureError(e);
    logger.warn('[polymarket] Failed to sync CLOB balance', { error: error.message });
  }
}
