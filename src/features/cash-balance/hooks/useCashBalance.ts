import { CASH_BALANCE_USDC_BY_CHAIN_ID } from '@/features/cash-balance/constants';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { ChainId } from '@/features/network/types/backendNetworks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const CASH_BALANCE_ASSET = CASH_BALANCE_USDC_BY_CHAIN_ID[ChainId.base];
// Lowercased once here since nothing guarantees userAssetsStore's own keys are lowercased —
// the address casing addys returns for a given asset isn't normalized before that store builds
// its map keys, so an exact-casing key lookup could silently miss a checksummed match.
const CASH_BALANCE_ADDRESS = CASH_BALANCE_ASSET?.address.toLowerCase();

export function useCashBalance(): string {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  return useUserAssetsStore(state => {
    const asset = CASH_BALANCE_ADDRESS
      ? Array.from(state.userAssets.values()).find(
          userAsset => userAsset.chainId === ChainId.base && userAsset.address.toLowerCase() === CASH_BALANCE_ADDRESS
        )
      : undefined;
    // Recomputed from amount + price rather than reading asset.native.balance.display, which is
    // cached from the last fetch and can still reflect the previous nativeCurrency while a
    // currency-change refetch is in flight (userAssetsStore uses keepPreviousData).
    return asset
      ? convertAmountAndPriceToNativeDisplay(asset.balance.amount, asset.price?.value ?? 0, nativeCurrency).display
      : convertAmountToNativeDisplay(0, nativeCurrency);
  });
}
