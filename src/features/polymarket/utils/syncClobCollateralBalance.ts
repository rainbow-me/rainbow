import { AssetType, type ClobClient } from '@polymarket/clob-client-v2';

import { ensureError, logger } from '@/logger';

export async function syncClobCollateralBalance(client: ClobClient): Promise<void> {
  try {
    await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });
  } catch (e) {
    const error = ensureError(e);
    logger.warn('[polymarket] Failed to sync CLOB balance', { error: error.message });
  }
}
