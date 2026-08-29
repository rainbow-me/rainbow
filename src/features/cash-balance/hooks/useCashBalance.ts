import { getUniqueId } from '@/entities/assetId';
import { CASH_USDC_BY_NETWORK } from '@/features/cash/constants';
import { RampNetwork } from '@/features/cash/services/rampClient';
import { useUserAssetsStore } from '@/state/assets/userAssets';

const CASH_BALANCE_ASSET = CASH_USDC_BY_NETWORK[RampNetwork.Base];
const CASH_BALANCE_UNIQUE_ID = CASH_BALANCE_ASSET ? getUniqueId(CASH_BALANCE_ASSET.address, CASH_BALANCE_ASSET.chainId) : undefined;

/**
 * The wallet's Cash Balance is its USDC-on-Base holding. This reads it directly off
 * `userAssetsStore` rather than depending on APP-4032's asset-list filtering, since the two
 * ship independently behind the same [[useIsCashBalanceEnabled]] flag.
 */
export function useCashBalance(): string {
  return useUserAssetsStore(state => {
    const asset = CASH_BALANCE_UNIQUE_ID ? state.userAssets.get(CASH_BALANCE_UNIQUE_ID) : undefined;
    return asset?.native.balance.display ?? '$0.00';
  });
}
