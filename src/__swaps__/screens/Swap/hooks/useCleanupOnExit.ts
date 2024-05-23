import { useEffect } from 'react';
import { swapsStore } from '@/state/swaps/swapsStore';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { useSwapContext } from '../providers/swap-provider';
import { SwapAssetType } from '@/__swaps__/types/swap';

export const useCleanupOnExit = () => {
  const { setAsset, internalSelectedOutputAsset, SwapInputsController } = useSwapContext();

  useEffect(() => {
    return () => {
      const firstUserAsset = userAssetsStore.getState().userAssets.values().next().value;
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: firstUserAsset,
        userAsset: firstUserAsset,
      });

      // reset back to the user's asset with largest balance
      setAsset({
        type: SwapAssetType.inputAsset,
        asset: parsedAsset,
      });

      // reset output asset to null
      internalSelectedOutputAsset.value = null;
      swapsStore.setState({ outputAsset: null });

      // stop quote fetching interval if it was set
      SwapInputsController.quoteFetchingInterval.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
