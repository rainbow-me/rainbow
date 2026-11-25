import React, { useMemo } from 'react';
import { Platform, Share } from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';

import { DropdownMenu, type MenuConfig, type MenuItem } from '@/components/DropdownMenu';
import { Box, TextIcon } from '@/design-system';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { pinnedCoinsActions, useCurrentPinnedCoins } from '@/features/wallet/data/walletScreen/base/pinnedCoinsStore';
import { buildTokenDeeplink } from '@/handlers/deeplinks';
import * as i18n from '@/languages';
import { userAssetsActions, useUserAssetsStore } from '@/state/assets/userAssets';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import ethereumUtils from '@/utils/ethereumUtils';

import { useExpandedAssetSheetContext } from '../context/ExpandedAssetSheetContext';

// This is meant to for the context menu to be offset properly, but it does not work for the horizontal offset
const HIT_SLOP = 16;

const BUTTON_SIZE = 44;

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

  const uniqueId = asset.uniqueId;
  const isHidden = useUserAssetsStore(s => s.hiddenAssets.has(uniqueId));
  const isPinned = useCurrentPinnedCoins(s => s[uniqueId.toLowerCase()] ?? false);
  const chainLabels = useBackendNetworksStore(s => s.getChainsLabel());

  const menuConfig = useMemo<MenuConfig<ContextMenuAction>>(() => {
    const menuItems: MenuItem<ContextMenuAction>[] = [];

    if (asset.address && !asset.isNativeAsset) {
      menuItems.push({
        actionKey: ContextMenuActions.BlockExplorer,
        actionTitle: i18n.t(i18n.l.expanded_state.asset.menu.view_on, {
          blockExplorerName: ethereumUtils.getBlockExplorer({ chainId: asset.chainId }),
        }),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'network',
        },
      });

      menuItems.push({
        actionKey: ContextMenuActions.Copy,
        actionTitle: i18n.t(i18n.l.expanded_state.asset.menu.copy_contract_address),
        actionSubtitle: asset.address.slice(0, 6) + '...' + asset.address.slice(-4),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      });
    }

    menuItems.push({
      actionKey: ContextMenuActions.Share,
      actionTitle: i18n.t(i18n.l.expanded_state.asset.menu.share),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'square.and.arrow.up',
      },
    });

    menuItems.push({
      actionKey: isHidden ? ContextMenuActions.Unhide : ContextMenuActions.Hide,
      actionTitle: i18n.t(isHidden ? i18n.l.expanded_state.asset.menu.unhide : i18n.l.expanded_state.asset.menu.hide),
      icon: { iconType: 'SYSTEM', iconValue: 'eye.slash' },
    });

    menuItems.push({
      actionKey: isPinned ? ContextMenuActions.Unpin : ContextMenuActions.Pin,
      actionTitle: i18n.t(isPinned ? i18n.l.expanded_state.asset.menu.unpin : i18n.l.expanded_state.asset.menu.pin),
      icon: { iconType: 'SYSTEM', iconValue: 'pin' },
    });

    return {
      menuItems,
    };
  }, [asset, isHidden, isPinned]);

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
          Platform.OS === 'android'
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
        pinnedCoinsActions.setPinnedCoins([uniqueId], true);
        break;
      case ContextMenuActions.Unpin:
        pinnedCoinsActions.setPinnedCoins([uniqueId], false);
        break;
      case ContextMenuActions.Hide:
      case ContextMenuActions.Unhide:
        userAssetsActions.setHiddenAssets([uniqueId]);
        break;
    }
  };

  return (
    <Box style={{ margin: Platform.OS === 'android' ? 0 : -HIT_SLOP }}>
      <DropdownMenu<ContextMenuAction> menuConfig={menuConfig} onPressMenuItem={handlePressMenuItem}>
        <Box style={{ margin: Platform.OS === 'android' ? 0 : HIT_SLOP }}>
          <Box
            alignItems="center"
            height={BUTTON_SIZE}
            justifyContent="center"
            style={{
              backgroundColor: accentColors.opacity6,
              borderColor: accentColors.opacity6,
              borderRadius: BUTTON_SIZE / 2,
              borderWidth: THICK_BORDER_WIDTH,
            }}
            width={BUTTON_SIZE}
          >
            <TextIcon color={{ custom: accentColors.color }} containerSize={BUTTON_SIZE} size="icon 20px" weight="heavy">
              􀍠
            </TextIcon>
          </Box>
        </Box>
      </DropdownMenu>
    </Box>
  );
}
