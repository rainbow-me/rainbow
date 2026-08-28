import { getUniqueId } from '@/entities/assetId';
import { CASH_USDC_BY_NETWORK } from '@/features/cash/constants';
import { RampNetwork } from '@/features/cash/services/rampClient';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { shallowEqual } from '@/worklets/comparisons';

const CASH_BALANCE_ASSET = CASH_USDC_BY_NETWORK[RampNetwork.Base];
const CASH_BALANCE_UNIQUE_ID = CASH_BALANCE_ASSET ? getUniqueId(CASH_BALANCE_ASSET.address, CASH_BALANCE_ASSET.chainId) : undefined;

/**
 * The wallet's Cash Balance is its USDC-on-Base holding. This reads it directly off
 * `userAssetsStore` rather than depending on APP-4032's asset-list filtering, since the two
 * ship independently behind the same [[useIsCashBalanceEnabled]] flag.
 */
export function useCashBalance(): { balanceDisplay: string; hasBalance: boolean } {
  return useUserAssetsStore(state => {
    const asset = CASH_BALANCE_UNIQUE_ID ? state.userAssets.get(CASH_BALANCE_UNIQUE_ID) : undefined;
    return {
      balanceDisplay: asset?.native.balance.display ?? '$0.00',
      hasBalance: Number(asset?.native.balance.amount ?? 0) > 0,
    };
  }, shallowEqual);
}
