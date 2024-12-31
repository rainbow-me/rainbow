import { selectorFilterByUserChains, selectUserAssetsList } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { userAssetsFetchQuery } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
import store from '@/redux/store';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

export const hasNonZeroTotalBalance = async (): Promise<boolean> => {
  const { accountAddress, nativeCurrency } = store.getState().settings;

  const userAssetsDictByChain = await userAssetsFetchQuery({
    address: accountAddress,
    currency: nativeCurrency,
    testnetMode: useConnectedToAnvilStore.getState().connectedToAnvil,
  });

  const assets = selectorFilterByUserChains({ data: userAssetsDictByChain, selector: selectUserAssetsList });

  if (!assets?.length) return false;

  return assets.some(asset => Number(asset.balance?.amount) > 0);
};
