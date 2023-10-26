import store from '@/redux/store';
import { fetchUserAssets } from '@/resources/assets/UserAssetsQuery';

export const hasNonZeroTotalBalance = async (): Promise<boolean> => {
  const { accountAddress, nativeCurrency } = store.getState().settings;

  const assets = await fetchUserAssets({
    address: accountAddress,
    currency: nativeCurrency,
    connectedToHardhat: false,
  });

  if (!assets || Object.keys(assets).length === 0) return false;

  return Object.values(assets).some(asset => Number(asset.balance?.amount) > 0);
};
