import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { EmptyAssetList } from '../asset-list';
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
} from '@/screens/change-wallet/ChangeWalletSheet';
import { Box, Inset, Separator, Text } from '@/design-system';
import { DndProvider, Draggable, DraggableFlatListProps, UniqueIdentifier } from '../drag-and-drop';
import { PinnedWalletsGrid } from '@/screens/change-wallet/PinnedWalletsGrid';
import { usePinnedWalletsStore } from '@/state/wallets/pinnedWalletsStore';
import { MenuItem } from '@/components/DropdownMenu';
import { DraggableScrollView } from '@/components/drag-and-drop/components/DraggableScrollView';

const DRAG_ACTIVATION_DELAY = 150;
const LIST_TOP_PADDING = 7.5;
const TRANSITION_DURATION = 75;
const LIST_MAX_HEIGHT = MAX_PANEL_HEIGHT - PANEL_HEADER_HEIGHT;

const EmptyWalletList = styled(EmptyAssetList).attrs({
  descendingOpacity: true,
  pointerEvents: 'none',
})({
  ...position.coverAsObject,
  backgroundColor: ({ theme: { colors } }: any) => colors.white,
  paddingTop: LIST_TOP_PADDING,
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

  const [ready, setReady] = useState(false);
  const opacityAnimation = useSharedValue(walletItems.length ? 1 : 0);
  const emptyOpacityAnimation = useSharedValue(walletItems.length ? 0 : 1);

  const reorderUnpinnedAddresses = usePinnedWalletsStore(state => state.reorderUnpinnedAddresses);

  // TODO: convert the effect below into an animated reaction
  useEffect(() => {
    if (walletItems.length && !ready) {
      setTimeout(() => {
        setReady(true);
        emptyOpacityAnimation.value = withTiming(0, {
          duration: TRANSITION_DURATION,
          easing: Easing.out(Easing.ease),
        });
      }, 50);
    }
  }, [walletItems, ready, emptyOpacityAnimation]);

  useLayoutEffect(() => {
    if (walletItems.length) {
      opacityAnimation.value = withTiming(1, {
        duration: TRANSITION_DURATION,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [walletItems, opacityAnimation]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacityAnimation.value,
  }));

  const emptyOpacityStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacityAnimation.value,
  }));

  const onOrderChange: DraggableFlatListProps<AddressItem>['onOrderChange'] = useCallback(
    (value: UniqueIdentifier[]) => {
      // TODO: once upstream dnd fixes integrated
      // reorderUnpinnedAddresses(value as string[]);
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
            <Inset horizontal="16px">
              <Separator color="separatorSecondary" thickness={1} />
            </Inset>
            <Box paddingHorizontal="16px" paddingVertical="28px">
              <Text color="label" size="17pt" weight="heavy">
                {'All Wallets'}
              </Text>
            </Box>
          </>
        )}
        {!hasPinnedWallets && <View style={{ height: 20 }} />}
      </>
    );
  }, [pinnedWalletItems, onPressAccount, editMode, unpinnedWalletItems.length, menuItems, onPressMenuItem]);

  const renderItem = useCallback(
    (item: AddressItem) => (
      <Draggable key={item.id.toString()} dragDirection="y" id={item.id.toString()}>
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

  return (
    <Box>
      <Animated.View style={[StyleSheet.absoluteFill, emptyOpacityStyle]}>
        <EmptyWalletList />
      </Animated.View>
      <Animated.View style={opacityStyle}>
        <DndProvider activationDelay={DRAG_ACTIVATION_DELAY} disabled={!editMode}>
          <DraggableScrollView
            onOrderChange={onOrderChange}
            style={{ maxHeight: LIST_MAX_HEIGHT }}
            autoScrollInsets={{ bottom: FOOTER_HEIGHT - 24 }}
            contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT - 24 }}
            data={unpinnedWalletItems}
          >
            {renderHeader()}
            {unpinnedWalletItems.map(item => renderItem(item))}
          </DraggableScrollView>
        </DndProvider>
      </Animated.View>
    </Box>
  );
}
