import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import { useExpandedStateNavigation } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { RainbowToken } from '@/entities';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useNavigation } from '@/navigation';
import { SWAPS_V2, useExperimentalFlag } from '@/config';
import { ethereumUtils } from '@/utils';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { chainNameFromChainId } from '@/__swaps__/utils/chains';
import assetInputTypes from '@/helpers/assetInputTypes';
import { swapsStore } from '@/state/swaps/swapsStore';
import { InteractionManager } from 'react-native';
import { AddressOrEth, AssetType } from '@/__swaps__/types/assets';

type SwapActionButtonProps = {
  asset: RainbowToken;
  color: string;
  inputType: 'in' | 'out';
  label?: string;
  fromDiscover?: boolean;
  weight?: string;
};

function SwapActionButton({ asset, color: givenColor, inputType, label, fromDiscover, weight = 'heavy', ...props }: SwapActionButtonProps) {
  const { colors } = useTheme();
  const { swaps_v2 } = useRemoteConfig();
  const { navigate } = useNavigation();
  const swapsV2Enabled = useExperimentalFlag(SWAPS_V2);

  const color = givenColor || colors.swapPurple;

  const old_navigate = useExpandedStateNavigation(inputType, fromDiscover, asset);
  const goToSwap = useCallback(() => {
    if (swapsV2Enabled || swaps_v2) {
      const chainId = ethereumUtils.getChainIdFromNetwork(asset.network);
      const userAsset = userAssetsStore.getState().userAssets.get(`${asset.address}_${chainId}`);

      const parsedAsset = parseSearchAsset({
        assetWithPrice: {
          ...asset,
          address: asset.address as AddressOrEth,
          type: asset.type as AssetType,
          chainId,
          chainName: chainNameFromChainId(chainId),
          isNativeAsset: false,
          native: {},
        },
        searchAsset: {
          ...asset,
          chainId,
          chainName: chainNameFromChainId(chainId),
          address: asset.address as AddressOrEth,
          highLiquidity: asset.highLiquidity ?? false,
          isRainbowCurated: asset.isRainbowCurated ?? false,
          isVerified: asset.isVerified ?? false,
          mainnetAddress: (asset.mainnet_address ?? '') as AddressOrEth,
          networks: asset.networks ?? [],
        },
        userAsset,
      });

      if (inputType === assetInputTypes.in) {
        swapsStore.setState({ inputAsset: parsedAsset });
      } else {
        const largestBalanceSameChainUserAsset = userAssetsStore
          .getState()
          .getUserAssets()
          .find(userAsset => userAsset.chainId === chainId && userAsset.address !== asset.address);
        if (largestBalanceSameChainUserAsset) {
          swapsStore.setState({ inputAsset: largestBalanceSameChainUserAsset });
        }
        swapsStore.setState({ outputAsset: parsedAsset });
      }

      InteractionManager.runAfterInteractions(() => {
        navigate(Routes.SWAP);
      });

      return;
    }

    old_navigate(Routes.EXCHANGE_MODAL, (params: any) => {
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
  }, [asset, inputType, navigate, old_navigate, swapsV2Enabled, swaps_v2]);

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

export default React.memo(SwapActionButton);
