import { RainbowAddressAssets } from './types';

// selector generators
export function selectUserAssetWithUniqueId(uniqueId: string) {
  return (assets: RainbowAddressAssets) => {
    return assets?.[uniqueId];
  };
}
