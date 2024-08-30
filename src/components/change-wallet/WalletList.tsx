import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import networkTypes from '../../helpers/networkTypes';
import WalletTypes from '../../helpers/walletTypes';
import { address } from '../../utils/abbreviations';
import Divider from '../Divider';
import { EmptyAssetList } from '../asset-list';
import { Column } from '../layout';
import AddressRow from './AddressRow';
import WalletOption from './WalletOption';
import { EthereumAddress } from '@rainbow-me/entities';
import { useAccountSettings } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { EditWalletContextMenuActions } from '@/screens/ChangeWalletSheet';
import { HARDWARE_WALLETS, useExperimentalFlag } from '@/config';
import { Inset, Stack } from '@/design-system';

const listTopPadding = 7.5;
const rowHeight = 59;
const transitionDuration = 75;

const RowTypes = {
  ADDRESS: 1,
  EMPTY: 2,
};

const getItemLayout = (data: any, index: number) => {
  const { height } = data[index];
  return {
    index,
    length: height,
    offset: height * index,
  };
};

const keyExtractor = (item: any) => `${item.walletId}-${item?.id}`;

// @ts-ignore
const Container = styled.View({
  height: ({ height }: { height: number }) => height,
  marginTop: -2,
});

const WalletsContainer = styled(Animated.View)({
  flex: 1,
});

const EmptyWalletList = styled(EmptyAssetList).attrs({
  descendingOpacity: true,
  pointerEvents: 'none',
})({
  ...position.coverAsObject,
  backgroundColor: ({ theme: { colors } }: any) => colors.white,
  paddingTop: listTopPadding,
});

const WalletFlatList = styled(FlatList).attrs(({ showDividers }: { showDividers: boolean }) => ({
  contentContainerStyle: {
    paddingBottom: showDividers ? 9.5 : 0,
    paddingTop: listTopPadding,
  },
  getItemLayout,
  keyExtractor,
  removeClippedSubviews: true,
}))({
  flex: 1,
  minHeight: 1,
});

const WalletListDivider = styled(Divider).attrs(({ theme: { colors } }: any) => ({
  color: colors.rowDividerExtraLight,
  inset: [0, 15],
}))({
  marginBottom: 1,
  marginTop: -1,
});

interface Props {
  accountAddress: EthereumAddress;
  allWallets: any;
  contextMenuActions: EditWalletContextMenuActions;
  currentWallet: any;
  editMode: boolean;
  height: number;
  onChangeAccount: (walletId: string, address: EthereumAddress) => void;
  onPressAddAnotherWallet: () => void;
  onPressPairHardwareWallet: () => void;
  scrollEnabled: boolean;
  showDividers: boolean;
  watchOnly: boolean;
}

export default function WalletList({
  accountAddress,
  allWallets,
  contextMenuActions,
  currentWallet,
  editMode,
  height,
  onChangeAccount,
  onPressAddAnotherWallet,
  onPressPairHardwareWallet,
  scrollEnabled,
  showDividers,
  watchOnly,
}: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const scrollView = useRef(null);
  const { network } = useAccountSettings();
  const opacityAnimation = useSharedValue(0);
  const emptyOpacityAnimation = useSharedValue(1);
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);

  // Update the rows when allWallets changes
  useEffect(() => {
    const seedRows: any[] = [];
    const privateKeyRows: any[] = [];
    const readOnlyRows: any[] = [];

    if (isEmpty(allWallets)) return;
    const sortedKeys = Object.keys(allWallets).sort();
    sortedKeys.forEach(key => {
      const wallet = allWallets[key];
      const filteredAccounts = wallet.addresses.filter((account: any) => account.visible);
      filteredAccounts.forEach((account: any) => {
        const row = {
          ...account,
          editMode,
          height: rowHeight,
          id: account.address,
          isOnlyAddress: filteredAccounts.length === 1,
          isReadOnly: wallet.type === WalletTypes.readOnly,
          isLedger: wallet.type === WalletTypes.bluetooth,
          isSelected: accountAddress === account.address && (watchOnly || wallet?.id === currentWallet?.id),
          label: network !== networkTypes.mainnet && account.ens === account.label ? address(account.address, 6, 4) : account.label,
          onPress: () => onChangeAccount(wallet?.id, account.address),
          rowType: RowTypes.ADDRESS,
          walletId: wallet?.id,
        };
        switch (wallet.type) {
          case WalletTypes.mnemonic:
          case WalletTypes.seed:
          case WalletTypes.bluetooth:
            seedRows.push(row);
            break;
          case WalletTypes.privateKey:
            privateKeyRows.push(row);
            break;
          case WalletTypes.readOnly:
            readOnlyRows.push(row);
            break;
          default:
            break;
        }
      });
    });

    const newRows = [...seedRows, ...privateKeyRows, ...readOnlyRows];
    setRows(newRows);
  }, [accountAddress, allWallets, currentWallet?.id, editMode, network, onChangeAccount, watchOnly]);

  // Update the data provider when rows change
  useEffect(() => {
    if (rows?.length && !ready) {
      setTimeout(() => {
        setReady(true);
        emptyOpacityAnimation.value = withTiming(0, {
          duration: transitionDuration,
          easing: Easing.out(Easing.ease),
        });
      }, 50);
    }
  }, [rows, ready, emptyOpacityAnimation]);

  useLayoutEffect(() => {
    if (ready) {
      opacityAnimation.value = withTiming(1, {
        duration: transitionDuration,
        easing: Easing.in(Easing.ease),
      });
    } else {
      opacityAnimation.value = 0;
    }
  }, [ready, opacityAnimation]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacityAnimation.value,
  }));

  const emptyOpacityStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacityAnimation.value,
  }));

  const renderItem = useCallback(
    ({ item }: any) => {
      switch (item.rowType) {
        case RowTypes.ADDRESS:
          return (
            <Column height={item.height}>
              <AddressRow contextMenuActions={contextMenuActions} data={item} editMode={editMode} onPress={item.onPress} />
            </Column>
          );
        default:
          return null;
      }
    },
    [contextMenuActions, editMode]
  );

  return (
    <Container height={height}>
      <Animated.View style={[StyleSheet.absoluteFill, emptyOpacityStyle]}>
        <EmptyWalletList />
      </Animated.View>
      <WalletsContainer style={opacityStyle}>
        <WalletFlatList
          data={rows}
          initialNumToRender={rows.length}
          ref={scrollView}
          renderItem={renderItem}
          scrollEnabled={scrollEnabled}
          showDividers={showDividers}
        />
        {showDividers && <WalletListDivider />}
        {!watchOnly && (
          <Inset space="20px">
            <Stack space="24px">
              <WalletOption
                editMode={editMode}
                label={`􀁍 ${lang.t('wallet.action.add_another')}`}
                onPress={onPressAddAnotherWallet}
                testID="add-another-wallet-button"
              />

              {hardwareWalletsEnabled && (
                <WalletOption
                  editMode={editMode}
                  label={`􀱝 ${lang.t('wallet.action.pair_hardware_wallet')}`}
                  onPress={onPressPairHardwareWallet}
                  testID="pair-hardware-wallet-button"
                />
              )}
            </Stack>
          </Inset>
        )}
      </WalletsContainer>
    </Container>
  );
}
