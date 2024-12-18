import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { RainbowToken } from '@/entities';
import { ethereumUtils } from '@/utils';
import { userAssetsStore } from '@/state/assets/userAssets';
import { isSameAsset, parseSearchAsset } from '@/__swaps__/utils/assets';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { swapsStore } from '@/state/swaps/swapsStore';
import { InteractionManager } from 'react-native';
import { AddressOrEth, AssetType, ParsedSearchAsset } from '@/__swaps__/types/assets';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

type SwapActionButtonProps = {
  asset: RainbowToken;
  color: string;
  inputType: SwapAssetType;
  label?: string;
  weight?: string;
};

function SwapActionButton({ asset, color: givenColor, inputType, label, weight = 'heavy', ...props }: SwapActionButtonProps) {
  const { colors } = useTheme();
  const navigate = useNavigationForNonReadOnlyWallets();

  const color = givenColor || colors.swapPurple;

  const goToSwap = useCallback(async () => {
    const chainsIdByName = useBackendNetworksStore.getState().getChainsIdByName();
    const chainsName = useBackendNetworksStore.getState().getChainsName();
    const chainId = asset.chainId || chainsIdByName[asset.network];
    const uniqueId = `${asset.address}_${chainId}`;
    const userAsset = userAssetsStore.getState().userAssets.get(uniqueId);

    const parsedAsset = parseSearchAsset({
      assetWithPrice: {
        ...asset,
        uniqueId,
        address: asset.address as AddressOrEth,
        type: asset.type as AssetType,
        chainId,
        chainName: chainsName[chainId],
        isNativeAsset: false,
        native: {},
      },
      searchAsset: {
        ...asset,
        uniqueId,
        chainId,
        chainName: chainsName[chainId],
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

    if (inputType === SwapAssetType.inputAsset) {
      swapsStore.setState({ inputAsset: userAsset || parsedAsset });

      const nativeAssetForChain = await ethereumUtils.getNativeAssetForNetwork({ chainId });
      if (nativeAssetForChain && !isSameAsset({ address: nativeAssetForChain.address as AddressOrEth, chainId }, parsedAsset)) {
        const userOutputAsset = userAssetsStore.getState().getUserAsset(`${nativeAssetForChain.address}_${chainId}`);

        if (userOutputAsset) {
          swapsStore.setState({ outputAsset: userOutputAsset });
        } else {
          const outputAsset = {
            ...nativeAssetForChain,
            uniqueId: `${nativeAssetForChain.address}_${chainId}`,
            chainId,
            chainName: chainsName[chainId],
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
  }, [asset, inputType, navigate]);

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
