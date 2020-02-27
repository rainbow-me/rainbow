import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';

export default function useAccountAssets() {
  const accountData = useSelector(
    ({
      data: { assetPricesFromUniswap, assets, compoundAssets },
      settings: { nativeCurrency },
    }) => ({
      assetPricesFromUniswap,
      assets,
      compoundAssets,
      nativeCurrency,
    })
  );

  return Object.assign(
    accountData,
    sortAssetsByNativeAmountSelector(accountData)
  );
}
