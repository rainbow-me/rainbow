import React, { useMemo } from 'react';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, Column, Columns } from '@/design-system';
import { useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import * as i18n from '@/languages';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { BuyActionButton, SendActionButton, SheetActionButton, SwapActionButton } from '@/components/sheet';
import { DropdownMenu, MenuConfig, MenuItem } from '@/components/DropdownMenu';
import Clipboard from '@react-native-clipboard/clipboard';
import { ethereumUtils } from '@/utils';

// 32px for the gradient + 46px for the buttons + 44px for the bottom padding
export const SHEET_FOOTER_HEIGHT = 32 + 46 + 44;

export enum ContextMenuActions {
  BlockExplorer = 'block_explorer',
  Share = 'share',
  Copy = 'copy',
}

type ContextMenuAction = ContextMenuActions.BlockExplorer | ContextMenuActions.Share | ContextMenuActions.Copy;

export function SheetFooter() {
  const { accentColors, asset, isOwnedAsset } = useExpandedAssetSheetContext();

  // TODO:
  const isTransferable = isOwnedAsset;
  const hasEth = true;
  const isSwappable = isOwnedAsset;

  const menuConfig = useMemo<MenuConfig<ContextMenuAction>>(() => {
    const menuItems = [] as MenuItem<ContextMenuAction>[];

    if (asset.address && !asset.isNativeAsset) {
      menuItems.push({
        actionKey: ContextMenuActions.BlockExplorer,
        actionTitle: i18n.t('expanded_state.asset.menu.view_on', {
          blockExplorerName: ethereumUtils.getBlockExplorer({ chainId: asset.chainId }),
        }),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'network',
        },
      });
    }

    if (asset.address && !asset.isNativeAsset) {
      menuItems.push({
        actionKey: ContextMenuActions.Copy,
        actionTitle: i18n.t('expanded_state.asset.menu.copy_contract_address'),
        actionSubtitle: asset.address.slice(0, 6) + '...' + asset.address.slice(-4),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      });
    }

    menuItems.push({
      actionKey: ContextMenuActions.Share,
      actionTitle: i18n.t('expanded_state.asset.menu.share'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'square.and.arrow.up',
      },
    });

    return {
      menuItems,
    };
  }, [asset]);

  const handlePressMenuItem = (actionKey: ContextMenuAction) => {
    switch (actionKey) {
      case ContextMenuActions.Copy:
        Clipboard.setString(asset.address);
        break;
      case ContextMenuActions.Share:
        // TODO:
        break;
      case ContextMenuActions.BlockExplorer:
        ethereumUtils.openTokenEtherscanURL({ address: asset.address, chainId: asset.chainId });
        break;
    }
  };

  return (
    <Box pointerEvents="box-none" position="absolute" bottom="0px" width="full">
      <EasingGradient
        endColor={accentColors.background}
        startColor={accentColors.background}
        endOpacity={1}
        startOpacity={0}
        style={{ height: 30, width: '100%', pointerEvents: 'none' }}
      />
      <Box backgroundColor={accentColors.background} width="full" paddingVertical="2px" paddingHorizontal="24px" paddingBottom="44px">
        <Columns space="16px">
          <Column width="content">
            <DropdownMenu<ContextMenuAction> menuConfig={menuConfig} onPressMenuItem={handlePressMenuItem}>
              <SheetActionButton color={accentColors.opacity100} isSquare label={'􀍠'} />
            </DropdownMenu>
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
              // TODO: change to new copy
              label={`􀖅 ${i18n.t('expanded_state.asset.get_asset', {
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
