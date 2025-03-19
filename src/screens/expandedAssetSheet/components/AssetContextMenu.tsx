import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { DropdownMenu, MenuConfig, MenuItem } from '@/components/DropdownMenu';
import { SheetActionButton } from '@/components/sheet';
import { useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ethereumUtils } from '@/utils';
import { EditAction } from '@/screens/WalletScreen/UserAssets/UserAssetsListContext';
import Clipboard from '@react-native-clipboard/clipboard';
import { IS_ANDROID } from '@/env';
import { Box, TextIcon } from '@/design-system';
import { buildTokenDeeplink } from '@/handlers/deeplinks';
import { Share } from 'react-native';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

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
  const { accentColors, basicAsset: asset, assetMetadata } = useExpandedAssetSheetContext();
  const { pinnedAssets, hiddenAssets } = useUserAssetsStore(state => ({
    pinnedAssets: state.pinnedAssets,
    hiddenAssets: state.hiddenAssets,
  }));
  const setHiddenAssets = useUserAssetsStore(state => state.setHiddenAssets);
  const setPinnedAssets = useUserAssetsStore(state => state.setPinnedAssets);

  const chainLabels = useBackendNetworksStore(state => state.getChainsLabel());

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

    if (hiddenAssets.has(asset.uniqueId)) {
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

    if (pinnedAssets.has(asset.uniqueId)) {
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
  }, [asset, pinnedAssets, hiddenAssets]);

  const handlePressMenuItem = (actionKey: ContextMenuAction) => {
    switch (actionKey) {
      case ContextMenuActions.Copy:
        Clipboard.setString(asset.address);
        break;
      case ContextMenuActions.Share: {
        const url =
          assetMetadata?.links?.rainbow?.url ??
          buildTokenDeeplink({
            networkLabel: chainLabels[asset.chainId],
            contractAddress: asset.address,
          });
        Share.share(
          IS_ANDROID
            ? {
                message: url,
              }
            : {
                url,
              }
        );
        break;
      }
      case ContextMenuActions.BlockExplorer:
        ethereumUtils.openTokenEtherscanURL({ address: asset.address, chainId: asset.chainId });
        break;
      case ContextMenuActions.Pin:
        setPinnedAssets([asset.uniqueId], EditAction.pin);
        break;
      case ContextMenuActions.Unpin:
        setPinnedAssets([asset.uniqueId], EditAction.unpin);
        break;
      case ContextMenuActions.Hide:
        setHiddenAssets([asset.uniqueId], EditAction.hide);
        break;
      case ContextMenuActions.Unhide:
        setHiddenAssets([asset.uniqueId], EditAction.unhide);
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
