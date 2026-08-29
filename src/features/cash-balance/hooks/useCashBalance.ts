import { getUniqueId } from '@/entities/assetId';
import { CASH_USDC_BY_NETWORK } from '@/features/cash/constants';
import { RampNetwork } from '@/features/cash/services/rampClient';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const CASH_BALANCE_ASSET = CASH_USDC_BY_NETWORK[RampNetwork.Base];
const CASH_BALANCE_UNIQUE_ID = CASH_BALANCE_ASSET ? getUniqueId(CASH_BALANCE_ASSET.address, CASH_BALANCE_ASSET.chainId) : undefined;

export function useCashBalance(): string {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  return useUserAssetsStore(state => {
    const asset = CASH_BALANCE_UNIQUE_ID ? state.userAssets.get(CASH_BALANCE_UNIQUE_ID) : undefined;
    return asset?.native.balance.display ?? convertAmountToNativeDisplay(0, nativeCurrency);
  });
}
