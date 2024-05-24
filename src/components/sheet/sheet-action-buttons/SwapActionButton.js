import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import { useExpandedStateNavigation } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useRemoteConfig } from '@/model/remoteConfig';
import { SWAPS_V2, useExperimentalFlag } from '@/config';
import assetInputTypes from '@/helpers/assetInputTypes';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapAssetType } from '@/__swaps__/types/swap';

function SwapActionButton({ asset, color: givenColor, inputType, label, fromDiscover, weight = 'heavy', ...props }) {
  const { setAsset } = useSwapContext();
  const { swaps_v2 } = useRemoteConfig();
  const { navigate } = useNavigation();
  const swapsV2Enabled = useExperimentalFlag(SWAPS_V2);

  const { colors } = useTheme();
  const color = givenColor || colors.swapPurple;

  const old_navigate = useExpandedStateNavigation(inputType, fromDiscover, asset);
  const goToSwap = useCallback(() => {
    if (swapsV2Enabled || swaps_v2) {
      const chainId = ethereumUtils.getChainIdFromNetwork(asset.network);
      const userAsset = userAssetsStore.getState().userAssets.get(`${asset.address}_${chainId}`);
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: asset,
        userAsset,
      });

      console.log(parsedAsset);

      if (inputType === assetInputTypes.in) {
        setAsset({ type: SwapAssetType.inputAsset, asset: parsedAsset });
      } else {
        setAsset({ type: SwapAssetType.outputAsset, asset: parsedAsset });
      }

      InteractionManager.runAfterInteractions(() => {
        navigate(Routes.SWAP);
      });

      return;
    }

    old_navigate(Routes.EXCHANGE_MODAL, params => {
      if (params.outputAsset) {
        return {
          params: {
            defaultOutputAsset: asset,
            params: {
              outputAsset: asset,
            },
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        };
      } else {
        return {
          params: {
            defaultInputAsset: asset,
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        };
      }
    });
  }, [asset, inputType, navigate, old_navigate, setAsset, swapsV2Enabled, swaps_v2]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label={label || `􀖅 ${lang.t('button.swap')}`}
      onPress={goToSwap}
      testID="swap"
      weight={weight}
      truncate
    />
  );
}
import { useNavigation } from '@/navigation';
import { InteractionManager } from 'react-native';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { userAssetsStore } from '@/state/assets/userAssets';
import { ethereumUtils } from '@/utils';

export default React.memo(SwapActionButton);
