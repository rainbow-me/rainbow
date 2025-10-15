import i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import SheetActionButton from './SheetActionButton';
import { useTheme } from '@/theme';
import { RainbowToken } from '@/entities';
import { containsEmoji } from '@/helpers/strings';
import { ethereumUtils } from '@/utils';
import { userAssetsStore } from '@/state/assets/userAssets';
import { isSameAsset, parseSearchAsset } from '@/__swaps__/utils/assets';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { AddressOrEth, AssetType, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import {} from '@/__swaps__/utils/swaps';
import { Inline, Text, TextIcon } from '@/design-system';
import { NavigateToSwapsParams, navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';

type SwapActionButtonProps = {
  asset: RainbowToken;
  color: string;
  height?: number;
  icon?: string;
  inputType: SwapAssetType;
  textColor?: string;
  label?: string;
  weight?: string;
};

function SwapActionButton({ asset, color: givenColor, height, icon, inputType, label, weight = 'heavy', ...props }: SwapActionButtonProps) {
  const { colors } = useTheme();

  const color = givenColor || colors.swapPurple;
  const symbolHasEmoji = useMemo(() => (label ? containsEmoji(label) : false), [label]);

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

    const params: NavigateToSwapsParams = {};

    if (inputType === SwapAssetType.inputAsset) {
      params.inputAsset = userAsset || parsedAsset;

      const nativeAssetForChain = await ethereumUtils.getNativeAssetForNetwork({ chainId });
      if (nativeAssetForChain && !isSameAsset({ address: nativeAssetForChain.address as AddressOrEth, chainId }, parsedAsset)) {
        const userOutputAsset = userAssetsStore.getState().getUserAsset(`${nativeAssetForChain.address}_${chainId}`);

        if (userOutputAsset) {
          params.outputAsset = userOutputAsset;
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

          params.outputAsset = outputAsset;
        }
      }
    } else {
      const largestBalanceSameChainUserAsset = userAssetsStore
        .getState()
        .getUserAssets()
        .find(userAsset => userAsset.chainId === chainId && userAsset.address !== asset.address);

      if (largestBalanceSameChainUserAsset) {
        params.inputAsset = largestBalanceSameChainUserAsset;
        params.outputAsset = parsedAsset;
      } else {
        params.inputAsset = null;
        params.outputAsset = parsedAsset;
      }
    }

    navigateToSwaps(params);
  }, [asset, inputType]);

  return (
    <SheetActionButton
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      color={color}
      newShadows
      onPress={goToSwap}
      size={height}
      testID="swap"
      weight={weight}
      truncate
    >
      {icon ? (
        <Inline alignHorizontal="center" alignVertical="center" space="10px">
          <TextIcon color="label" size="icon 18px" weight="heavy">
            {icon}
          </TextIcon>
          <Text align="center" color="label" containsEmoji={symbolHasEmoji} numberOfLines={1} size="20pt" weight="heavy">
            {label || `${i18n.button.swap()}`}
          </Text>
        </Inline>
      ) : (
        <Text align="center" color="label" containsEmoji={symbolHasEmoji} numberOfLines={1} size="20pt" weight="heavy">
          {label || `${i18n.button.swap()}`}
        </Text>
      )}
    </SheetActionButton>
  );
}

export default React.memo(SwapActionButton);
