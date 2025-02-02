import React, { useMemo, useEffect } from 'react';
import * as i18n from '@/languages';
import { DropdownMenu, MenuConfig, MenuItem } from '@/components/DropdownMenu';
import { SheetActionButton } from '@/components/sheet';
import { useCoinListFinishEditingOptions, useCoinListEditOptions } from '@/hooks';
import { useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ethereumUtils } from '@/utils';
import EditAction from '@/helpers/EditAction';
import Clipboard from '@react-native-clipboard/clipboard';
import { IS_ANDROID } from '@/env';
import { Box, TextIcon } from '@/design-system';
import { buildTokenDeeplink } from '@/handlers/deeplinks';
import { Share } from 'react-native';

// This is meant to for the context menu to be offset properly, but it does not work for the horizontal offset
const HIT_SLOP = 16;

const ContextMenuActions = {
  BlockExplorer: 'block_explorer',
  Share: 'share',
  Copy: 'copy',
  Pin: 'pin',
  Unpin: 'unpin',
  Hide: 'hide',
  Unhide: 'unhide',
} as const;

type ContextMenuAction = (typeof ContextMenuActions)[keyof typeof ContextMenuActions];

export function AssetContextMenu() {
  const { accentColors, basicAsset: asset } = useExpandedAssetSheetContext();

  const { clearSelectedCoins, pushSelectedCoin } = useCoinListEditOptions();
  const setHiddenAssets = useUserAssetsStore(state => state.setHiddenAssets);

  const { currentAction, setPinnedCoins } = useCoinListFinishEditingOptions();

  useEffect(() => {
    // Ensure this expanded state's asset is always actively inside
    // the CoinListEditOptions selection queue
    pushSelectedCoin(asset.uniqueId);

    // Clear CoinListEditOptions selection queue on unmount.
    return () => clearSelectedCoins();
  }, [asset, clearSelectedCoins, currentAction, pushSelectedCoin]);

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

    if (currentAction === EditAction.unhide) {
      menuItems.push({
        actionKey: ContextMenuActions.Unhide,
        actionTitle: i18n.t('expanded_state.asset.menu.unhide'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'eye.slash',
        },
      });
    } else {
      menuItems.push({
        actionKey: ContextMenuActions.Hide,
        actionTitle: i18n.t('expanded_state.asset.menu.hide'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'eye.slash',
        },
      });
    }

    if (currentAction === EditAction.unpin) {
      menuItems.push({
        actionKey: ContextMenuActions.Unpin,
        actionTitle: i18n.t('expanded_state.asset.menu.unpin'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'pin',
        },
      });
    } else {
      menuItems.push({
        actionKey: ContextMenuActions.Pin,
        actionTitle: i18n.t('expanded_state.asset.menu.pin'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'pin',
        },
      });
    }

    return {
      menuItems,
    };
  }, [asset, currentAction]);

  const handlePressMenuItem = (actionKey: ContextMenuAction) => {
    switch (actionKey) {
      case ContextMenuActions.Copy:
        Clipboard.setString(asset.address);
        break;
      case ContextMenuActions.Share:
        Share.share({
          url: buildTokenDeeplink(asset.uniqueId),
        });
        break;
      case ContextMenuActions.BlockExplorer:
        ethereumUtils.openTokenEtherscanURL({ address: asset.address, chainId: asset.chainId });
        break;
      case ContextMenuActions.Pin:
        setPinnedCoins();
        break;
      case ContextMenuActions.Unpin:
        setPinnedCoins();
        break;
      case ContextMenuActions.Hide:
        setHiddenAssets([asset.uniqueId]);
        break;
      case ContextMenuActions.Unhide:
        setHiddenAssets([asset.uniqueId]);
        break;
    }
  };

  return (
    <Box style={{ margin: IS_ANDROID ? 0 : -HIT_SLOP }}>
      <DropdownMenu<ContextMenuAction> menuConfig={menuConfig} onPressMenuItem={handlePressMenuItem}>
        <Box style={{ margin: IS_ANDROID ? 0 : HIT_SLOP }}>
          <SheetActionButton color={accentColors.opacity100} newShadows isSquare size={48}>
            <TextIcon color="label" containerSize={48} size="icon 20px" weight="heavy">
              􀍠
            </TextIcon>
          </SheetActionButton>
        </Box>
      </DropdownMenu>
    </Box>
  );
}
