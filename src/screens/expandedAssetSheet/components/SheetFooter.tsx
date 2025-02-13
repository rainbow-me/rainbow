import c from 'chroma-js';
import React, { useMemo } from 'react';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, ColorModeProvider, Column, Columns, useColorMode } from '@/design-system';
import { useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import * as i18n from '@/languages';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { BuyActionButton, SendActionButton, SwapActionButton } from '@/components/sheet';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { AssetContextMenu } from './AssetContextMenu';
import { isTestnetChain } from '@/handlers/web3';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ColorMode, globalColors } from '@/design-system/color/palettes';
import { ParsedAddressAsset } from '@/entities';

// 32px for the gradient + 46px for the buttons + 44px for the bottom padding
export const SHEET_FOOTER_HEIGHT = 32 + 46 + 44;

export function SheetFooter() {
  const { accentColors, basicAsset: asset, accountAsset, isOwnedAsset } = useExpandedAssetSheetContext();
  const { isDarkMode } = useColorMode();

  const { swagg_enabled, f2c_enabled } = useRemoteConfig();
  const swapEnabled = swagg_enabled && useBackendNetworksStore.getState().getSwapSupportedChainIds().includes(asset.chainId);
  const isTestnet = isTestnetChain({ chainId: asset.chainId });

  const chainsWithBalance = useUserAssetsStore(state => state.getChainsWithBalance());
  const hasSwappableAssets = chainsWithBalance.length > 0;

  const isSwapButtonVisible = swapEnabled && isOwnedAsset && !isTestnet;
  const isSendButtonVisible = isOwnedAsset && asset.transferable;
  const isBuyEthButtonVisible = !hasSwappableAssets && f2c_enabled;
  const isBuyAssetButtonVisible = !isOwnedAsset && swapEnabled && !isBuyEthButtonVisible;

  const colorMode = useMemo(() => getAccentColorMode(accentColors.color, isDarkMode), [accentColors.color, isDarkMode]);

  return (
    <Box pointerEvents="box-none" position="absolute" bottom="0px" width="full">
      <EasingGradient
        endColor={accentColors.background}
        startColor={accentColors.background}
        endOpacity={1}
        startOpacity={0}
        style={{ height: 32, width: '100%', pointerEvents: 'none' }}
      />
      <ColorModeProvider value={colorMode}>
        <Box paddingHorizontal={'24px'} backgroundColor={accentColors.background} width="full" paddingBottom="44px">
          <Columns space="16px">
            <Column width="content">
              <AssetContextMenu />
            </Column>
            {isSwapButtonVisible && (
              <SwapActionButton asset={asset} color={accentColors.color} height={48} inputType={SwapAssetType.inputAsset} />
            )}
            {isSendButtonVisible && <SendActionButton asset={accountAsset as ParsedAddressAsset} color={accentColors.color} size={48} />}
            {isBuyEthButtonVisible && <BuyActionButton color={accentColors.color} size={48} />}
            {isBuyAssetButtonVisible && (
              <SwapActionButton
                asset={asset}
                color={accentColors.color}
                height={48}
                inputType={SwapAssetType.outputAsset}
                label={i18n.t(i18n.l.expanded_state.asset.get_asset, {
                  assetSymbol: asset?.symbol,
                })}
              />
            )}
          </Columns>
        </Box>
      </ColorModeProvider>
    </Box>
  );
}

export function getAccentColorMode(color: string, isDarkMode: boolean, fallbackColorMode: ColorMode = 'dark'): ColorMode {
  if (!color) return fallbackColorMode;
  try {
    const contrastWithWhite = c.contrast(color, globalColors.white100);
    if (contrastWithWhite < (isDarkMode ? 2.6 : 2)) return 'light';
    return 'dark';
  } catch (e) {
    return fallbackColorMode;
  }
}
