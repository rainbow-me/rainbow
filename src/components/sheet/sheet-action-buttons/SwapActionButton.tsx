import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import { useExpandedStateNavigation, useSwapCurrencyHandlers, useWallets } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { RainbowToken } from '@/entities';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useNavigation } from '@/navigation';
import { SWAPS_V2, useExperimentalFlag, enableActionsOnReadOnlyWallet } from '@/config';
import { ethereumUtils, watchingAlert } from '@/utils';
import { userAssetsStore } from '@/state/assets/userAssets';
import { isSameAsset, parseSearchAsset } from '@/__swaps__/utils/assets';
import { chainNameFromChainId } from '@/__swaps__/utils/chains';
import assetInputTypes from '@/helpers/assetInputTypes';
import { swapsStore } from '@/state/swaps/swapsStore';
import { InteractionManager } from 'react-native';
import { AddressOrEth, AssetType, ParsedSearchAsset } from '@/__swaps__/types/assets';
import exchangeModalTypes from '@/helpers/exchangeModalTypes';

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
  const { isReadOnlyWallet } = useWallets();

  const color = givenColor || colors.swapPurple;

  useSwapCurrencyHandlers({
    defaultInputAsset: inputType === assetInputTypes.in ? asset : null,
    defaultOutputAsset: inputType === assetInputTypes.out ? asset : null,
    shouldUpdate: true,
    type: exchangeModalTypes.swap,
  });

  const old_navigate = useExpandedStateNavigation(inputType, fromDiscover, asset);
  const goToSwap = useCallback(async () => {
    if (swapsV2Enabled || swaps_v2) {
      if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
        watchingAlert();
        return;
      }

      const chainId = ethereumUtils.getChainIdFromNetwork(asset.network);
      const uniqueId = `${asset.address}_${chainId}`;
      const userAsset = userAssetsStore.getState().userAssets.get(uniqueId);

      const parsedAsset = parseSearchAsset({
        assetWithPrice: {
          ...asset,
          uniqueId,
          address: asset.address as AddressOrEth,
          type: asset.type as AssetType,
          chainId,
          chainName: chainNameFromChainId(chainId),
          isNativeAsset: false,
          native: {},
        },
        searchAsset: {
          ...asset,
          uniqueId,
          chainId,
          chainName: chainNameFromChainId(chainId),
          address: asset.address as AddressOrEth,
          highLiquidity: asset.highLiquidity ?? false,
          isRainbowCurated: asset.isRainbowCurated ?? false,
          isVerified: asset.isVerified ?? false,
          mainnetAddress: (asset.mainnet_address ?? '') as AddressOrEth,
          networks: asset.networks ?? [],
          type: asset.type as AssetType,
        },
        userAsset,
      });

      if (inputType === assetInputTypes.in) {
        swapsStore.setState({ inputAsset: parsedAsset });

        const nativeAssetForChain = await ethereumUtils.getNativeAssetForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
        if (nativeAssetForChain && !isSameAsset({ address: nativeAssetForChain.address as AddressOrEth, chainId }, parsedAsset)) {
          const outputAsset = {
            ...nativeAssetForChain,
            uniqueId: `${nativeAssetForChain.address}_${chainId}`,
            chainId,
            chainName: chainNameFromChainId(chainId),
            address: nativeAssetForChain.address as AddressOrEth,
            type: nativeAssetForChain.type as AssetType,
            mainnetAddress: nativeAssetForChain.mainnet_address as AddressOrEth,
            networks: nativeAssetForChain.networks,
            colors: {
              primary: nativeAssetForChain.colors?.primary,
              fallback: nativeAssetForChain.colors?.fallback || undefined, // Ensure fallback is either string or undefined
            },
            highLiquidity: nativeAssetForChain.highLiquidity ?? false,
            isRainbowCurated: nativeAssetForChain.isRainbowCurated ?? false,
            isVerified: nativeAssetForChain.isVerified ?? false,
            native: {} as ParsedSearchAsset['native'],
            balance: {
              amount: nativeAssetForChain.balance?.amount ?? '0',
              display: nativeAssetForChain.balance?.display ?? '0',
            },
            isNativeAsset: true,
            price: {
              value: nativeAssetForChain.price?.value ?? 0,
              relative_change_24h: nativeAssetForChain.price?.relative_change_24h ?? 0,
            },
          } satisfies ParsedSearchAsset;

          swapsStore.setState({ outputAsset });
        }
      } else {
        const largestBalanceSameChainUserAsset = userAssetsStore
          .getState()
          .getUserAssets()
          .find(userAsset => userAsset.chainId === chainId && userAsset.address !== asset.address);
        if (largestBalanceSameChainUserAsset) {
          swapsStore.setState({ inputAsset: largestBalanceSameChainUserAsset });
        } else {
          swapsStore.setState({ inputAsset: null });
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
  }, [asset, inputType, isReadOnlyWallet, navigate, old_navigate, swapsV2Enabled, swaps_v2]);

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
