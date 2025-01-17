import React from 'react';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, Column, Columns } from '@/design-system';
import { useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import * as i18n from '@/languages';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { BuyActionButton, SendActionButton, SwapActionButton } from '@/components/sheet';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { AssetContextMenu } from './AssetContextMenu';

// 32px for the gradient + 46px for the buttons + 44px for the bottom padding
export const SHEET_FOOTER_HEIGHT = 32 + 46 + 44;

export function SheetFooter() {
  const { accentColors, basicAsset: asset, isOwnedAsset } = useExpandedAssetSheetContext();

  const { swagg_enabled, f2c_enabled } = useRemoteConfig();
  const swapEnabled = swagg_enabled && useBackendNetworksStore.getState().getSwapSupportedChainIds().includes(asset.chainId);
  const addCashEnabled = f2c_enabled;

  // TODO:
  const isTransferable = isOwnedAsset && asset;
  const hasEth = true;
  const isSwappable = isOwnedAsset && swapEnabled;

  return (
    <Box pointerEvents="box-none" position="absolute" bottom="0px" width="full">
      <EasingGradient
        endColor={accentColors.background}
        startColor={accentColors.background}
        endOpacity={1}
        startOpacity={0}
        style={{ height: 32, width: '100%', pointerEvents: 'none' }}
      />
      <Box paddingHorizontal={'24px'} backgroundColor={accentColors.background} width="full" paddingBottom="44px">
        <Columns space="16px">
          <Column width="content">
            <AssetContextMenu />
          </Column>
          {isSwappable && <SwapActionButton asset={asset} color={accentColors.opacity100} inputType={SwapAssetType.inputAsset} />}
          {isTransferable && <SendActionButton asset={asset} color={accentColors.opacity100} />}
          {/* TODO: confirm this is correct behavior */}
          {!hasEth && <BuyActionButton color={accentColors.opacity100} />}
          {!isOwnedAsset && (
            <SwapActionButton
              asset={asset}
              color={accentColors.opacity100}
              inputType={SwapAssetType.outputAsset}
              label={`􀖅 ${i18n.t(i18n.l.expanded_state.asset.get_asset, {
                assetSymbol: asset?.symbol,
              })}`}
              weight="heavy"
            />
          )}
        </Columns>
      </Box>
    </Box>
  );
}
