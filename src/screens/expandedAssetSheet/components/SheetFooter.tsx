import React, { useMemo } from 'react';

import c from 'chroma-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwapAssetType } from '@/__swaps__/types/swap';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { BuyActionButton, SwapActionButton } from '@/components/sheet';
import { Box, ColorModeProvider, Column, Columns, useColorMode } from '@/design-system';
import { globalColors, type ColorMode } from '@/design-system/color/palettes';
import type { ParsedAddressAsset } from '@/entities/tokens';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { SendActionButton } from '@/features/transfer/components/SendActionButton';
import { isTestnetChain } from '@/handlers/web3';
import * as i18n from '@/languages';
import { useUserAssetsStore } from '@/state/assets/userAssets';

import { useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';

// 32px for the easing gradient + 48px for the buttons + 12px for the extra bottom padding away from the area inset
export const SHEET_FOOTER_HEIGHT = 32 + 48 + 12;

const BUTTON_SIZE = 48;
// Matches the arrow used by the send button on the wallet screen
const SEND_ICON = '􀈟';

export function SheetFooter() {
  const { accentColors, basicAsset: asset, accountAsset, isOwnedAsset } = useExpandedAssetSheetContext();
  const safeAreaInsets = useSafeAreaInsets();
  const { isDarkMode } = useColorMode();

  const { swagg_enabled, f2c_enabled } = useRemoteConfig();
  const swapEnabled = swagg_enabled && useBackendNetworksStore.getState().getSwapSupportedChainIds().includes(asset.chainId);
  const isTestnet = isTestnetChain({ chainId: asset.chainId });

  const chainsWithBalance = useUserAssetsStore(state => state.getChainsWithBalance());
  const hasSwappableAssets = chainsWithBalance.length > 0;

  // Owning the asset splits the single swap button into a buy/sell pair
  const isBuySellPairVisible = swapEnabled && isOwnedAsset && !isTestnet;
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
        <Box
          paddingHorizontal={'24px'}
          backgroundColor={accentColors.background}
          width="full"
          paddingBottom={{ custom: safeAreaInsets.bottom + 12 }}
        >
          <Columns space="12px">
            {isBuySellPairVisible && (
              <SwapActionButton
                asset={asset}
                color={accentColors.color}
                height={BUTTON_SIZE}
                inputType={SwapAssetType.outputAsset}
                label={i18n.t(i18n.l.button.buy)}
                testID="buy"
              />
            )}
            {isBuySellPairVisible && (
              <SwapActionButton
                asset={asset}
                color={accentColors.color}
                height={BUTTON_SIZE}
                inputType={SwapAssetType.inputAsset}
                label={i18n.t(i18n.l.button.sell)}
                testID="sell"
              />
            )}
            {isSendButtonVisible && (
              <Column width="content">
                <SendActionButton
                  asset={accountAsset as ParsedAddressAsset}
                  color={accentColors.color}
                  icon={SEND_ICON}
                  isSquare
                  size={BUTTON_SIZE}
                />
              </Column>
            )}
            {isBuyEthButtonVisible && <BuyActionButton color={accentColors.color} size={BUTTON_SIZE} />}
            {isBuyAssetButtonVisible && (
              <SwapActionButton
                asset={asset}
                color={accentColors.color}
                height={BUTTON_SIZE}
                inputType={SwapAssetType.outputAsset}
                label={i18n.t(i18n.l.button.buy)}
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
