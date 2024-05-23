import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '../resources/assets';

import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { Hex } from 'viem';
import { userAssetsStore } from '@/state/assets/userAssets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useRoute } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { SearchAsset } from '@/__swaps__/types/search';
import { useSwapContext } from '../providers/swap-provider';
import { SwapAssetType } from '@/__swaps__/types/swap';

export const UserAssetsSync = () => {
  const { name } = useRoute();
  const { setAsset } = useSwapContext();
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  // TODO: Should we setAsset here as well?
  // probably only if they aren't on the SWAP screen...
  useUserAssets(
    {
      address: currentAddress as Hex,
      currency: currentCurrency,
    },
    {
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: selectUserAssetsList,
        }),
      onSuccess: (data = []) => {
        userAssetsStore.setState({
          userAssetsById: new Set(data.map(d => d.uniqueId)),
          userAssets: new Map(data.map(d => [d.uniqueId, d as ParsedSearchAsset])),
        });

        if (name !== Routes.SWAP) {
          const [firstAsset] = data;
          const parsedAsset = parseSearchAsset({
            assetWithPrice: undefined,
            searchAsset: firstAsset as unknown as SearchAsset, // NOTE: We don't really care about this since it's a userAsset
            userAsset: firstAsset,
          });

          setAsset({ asset: parsedAsset, type: SwapAssetType.inputAsset });
        }
      },
      enabled: !!currentAddress,
    }
  );

  return null;
};
