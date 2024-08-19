import { RainbowAddressAssets } from './types';

export function selectUserAssetWithUniqueId(uniqueId: string) {
  return (accountAssets: RainbowAddressAssets) => {
    return accountAssets?.[uniqueId];
  };
}
