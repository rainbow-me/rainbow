import { useSelector } from 'react-redux';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';

export default function useAccountData() {
  const accountData = useSelector(({ data, settings }) => ({
    accountAddress: settings.accountAddress,
    assets: data.assets,
    chainId: settings.chainId,
    nativeCurrency: settings.nativeCurrency,
    settings,
    tokenOverrides: data.tokenOverrides,
  }));

  return Object.assign(
    accountData,
    sortAssetsByNativeAmountSelector(accountData)
  );
}
