import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as i18n from '@/languages';
import { EmptyAssetList } from '@/components/asset-list';
import { AddressRow } from './AddressRow';
import { EthereumAddress } from '@rainbow-me/entities';
import styled from '@/styled-thing';
import { position } from '@/styles';
import {
  AddressItem,
  AddressMenuAction,
  AddressMenuActionData,
  FOOTER_HEIGHT,
  MAX_PANEL_HEIGHT,
  PANEL_HEADER_HEIGHT,
  PANEL_INSET_HORIZONTAL,
} from '@/screens/change-wallet/ChangeWalletSheet';
import { Box, Separator, Text } from '@/design-system';
import { DndProvider, Draggable, DraggableFlatListProps, UniqueIdentifier } from '@/components/drag-and-drop';
import { PinnedWalletsGrid } from '@/screens/change-wallet/PinnedWalletsGrid';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { MenuItem } from '@/components/DropdownMenu';
import { DraggableScrollView } from '@/components/drag-and-drop/components/DraggableScrollView';

const DRAG_ACTIVATION_DELAY = 150;
const FADE_TRANSITION_DURATION = 75;
const LIST_MAX_HEIGHT = MAX_PANEL_HEIGHT - PANEL_HEADER_HEIGHT;

const EmptyWalletList = styled(EmptyAssetList).attrs({
  descendingOpacity: true,
  pointerEvents: 'none',
})({
  ...position.coverAsObject,
  paddingTop: 7.5,
});

interface Props {
  walletItems: AddressItem[];
  editMode: boolean;
  menuItems: MenuItem<AddressMenuAction>[];
  onPressMenuItem: (actionKey: AddressMenuAction, data: AddressMenuActionData) => void;
  onPressAccount: (address: EthereumAddress) => void;
}

export function WalletList({ walletItems, menuItems, onPressMenuItem, onPressAccount, editMode }: Props) {
  const pinnedAddresses = usePinnedWalletsStore(state => state.pinnedAddresses);
  const unpinnedAddresses = usePinnedWalletsStore(state => state.unpinnedAddresses);

  const pinnedWalletItems = useMemo(() => {
    return walletItems
      .filter(item => pinnedAddresses.includes(item.id))
      .sort((a, b) => pinnedAddresses.indexOf(a.id) - pinnedAddresses.indexOf(b.id));
  }, [walletItems, pinnedAddresses]);

  // it would be more efficient to map the addresses to the wallet items, but the wallet items should be the source of truth
  const unpinnedWalletItems = useMemo(() => {
    return walletItems
      .filter(item => !pinnedAddresses.includes(item.id))
      .sort((a, b) => unpinnedAddresses.indexOf(a.id) - unpinnedAddresses.indexOf(b.id));
  }, [walletItems, pinnedAddresses, unpinnedAddresses]);

  const reorderUnpinnedAddresses = usePinnedWalletsStore(state => state.setUnpinnedAddresses);

  const onOrderChange: DraggableFlatListProps<AddressItem>['onOrderChange'] = useCallback(
    (value: UniqueIdentifier[]) => {
      reorderUnpinnedAddresses(value as string[]);
    },
    [reorderUnpinnedAddresses]
  );

  const renderHeader = useCallback(() => {
    const hasPinnedWallets = pinnedWalletItems.length > 0;
    return (
      <>
        {hasPinnedWallets && (
          <DndProvider activationDelay={DRAG_ACTIVATION_DELAY} disabled={!editMode}>
            <PinnedWalletsGrid
              menuItems={menuItems}
              onPressMenuItem={onPressMenuItem}
              walletItems={pinnedWalletItems}
              onPress={onPressAccount}
              editMode={editMode}
            />
          </DndProvider>
        )}
        {hasPinnedWallets && unpinnedWalletItems.length > 0 && (
          <>
            <Separator color="separatorSecondary" thickness={1} />
            <Box paddingVertical="28px">
              <Text color="label" size="17pt" weight="heavy">
                {i18n.t(i18n.l.wallet.change_wallet.all_wallets)}
              </Text>
            </Box>
          </>
        )}
        {!hasPinnedWallets && <View style={{ height: 20 }} />}
      </>
    );
  }, [pinnedWalletItems, onPressAccount, editMode, unpinnedWalletItems.length, menuItems, onPressMenuItem]);

  const renderScrollItem = useCallback(
    (item: AddressItem) => (
      <Draggable key={item.id} dragDirection="y" id={item.id.toString()}>
        <AddressRow
          menuItems={menuItems}
          onPressMenuItem={onPressMenuItem}
          data={item}
          editMode={editMode}
          onPress={() => onPressAccount(item.address)}
        />
      </Draggable>
    ),
    [menuItems, onPressMenuItem, onPressAccount, editMode]
  );

  // the draggable context should only layout its children when the number of children changes
  const draggableUnpinnedWalletItems = useMemo(() => {
    return unpinnedWalletItems;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unpinnedWalletItems.length]);

  return (
    <Box>
      {walletItems.length === 0 && (
        <Animated.View exiting={FadeOut.duration(FADE_TRANSITION_DURATION)} style={StyleSheet.absoluteFill}>
          <EmptyWalletList />
        </Animated.View>
      )}
      {walletItems.length > 0 && (
        <Animated.View entering={FadeIn.duration(FADE_TRANSITION_DURATION)}>
          <DndProvider activationDelay={DRAG_ACTIVATION_DELAY} disabled={!editMode}>
            <DraggableScrollView
              onOrderChange={onOrderChange}
              style={{ maxHeight: LIST_MAX_HEIGHT, marginHorizontal: -PANEL_INSET_HORIZONTAL, paddingHorizontal: PANEL_INSET_HORIZONTAL }}
              autoScrollInsets={{ bottom: FOOTER_HEIGHT - 24 }}
              contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT - 24 }}
            >
              {renderHeader()}
              {draggableUnpinnedWalletItems.map(item => renderScrollItem(item))}
            </DraggableScrollView>
          </DndProvider>
        </Animated.View>
      )}
    </Box>
  );
}
