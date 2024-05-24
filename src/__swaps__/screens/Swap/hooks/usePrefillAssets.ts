import { useEffect } from 'react';

import { RootStackParamList } from '@/navigation/types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { SearchAsset } from '@/__swaps__/types/search';

export const usePrefillAssets = ({
  setAsset,
}: {
  setAsset: ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset }) => void;
}) => {
  const { params = {} } = useRoute<RouteProp<RootStackParamList, 'Swap'>>();

  const { inputAssetUniqueId, outputAssetUniqueId } = params;

  useEffect(() => {
    if (inputAssetUniqueId) {
      // TODO: do we need to handle the case where the input asset isn't defined?
      const userAsset = userAssetsStore.getState().getUserAsset(inputAssetUniqueId);
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: userAsset as SearchAsset,
        userAsset,
      });

      setAsset({
        type: SwapAssetType.inputAsset,
        asset: parsedAsset,
      });
    }

    if (outputAssetUniqueId) {
      // TODO: do we need to handle the case where the output asset isn't defined?
      const userAsset = userAssetsStore.getState().getUserAsset(outputAssetUniqueId);
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: userAsset as SearchAsset,
        userAsset,
      });

      setAsset({
        type: SwapAssetType.outputAsset,
        asset: parsedAsset,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
