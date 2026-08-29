import { getUniqueId } from '@/entities/assetId';
import { CASH_BALANCE_USDC_BY_CHAIN_ID } from '@/features/cash-balance/constants';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { ChainId } from '@/features/network/types/backendNetworks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const CASH_BALANCE_ASSET = CASH_BALANCE_USDC_BY_CHAIN_ID[ChainId.base];
const CASH_BALANCE_UNIQUE_ID = CASH_BALANCE_ASSET ? getUniqueId(CASH_BALANCE_ASSET.address, ChainId.base) : undefined;

export function useCashBalance(): string {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  return useUserAssetsStore(state => {
    const asset = CASH_BALANCE_UNIQUE_ID ? state.userAssets.get(CASH_BALANCE_UNIQUE_ID) : undefined;
    return asset?.native.balance.display ?? convertAmountToNativeDisplay(0, nativeCurrency);
  });
}
