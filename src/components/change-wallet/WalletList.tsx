import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import WalletTypes from '../../helpers/walletTypes';
import { address } from '../../utils/abbreviations';
import { Text } from '@/components/text';
import Divider from '@/components/Divider';
import { EmptyAssetList } from '../asset-list';
import { Centered, Column, Row } from '../layout';
import AddressRow from './AddressRow';
import WalletOption from './WalletOption';
import { EthereumAddress } from '@rainbow-me/entities';
import { useAccountSettings, useWalletsWithBalancesAndNames } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { EditWalletContextMenuActions } from '@/screens/ChangeWalletSheet';
import { getExperimetalFlag, HARDWARE_WALLETS, useExperimentalFlag } from '@/config';
import { Inset, Stack } from '@/design-system';
import { Network } from '@/state/backendNetworks/types';
import { SheetTitle } from '../sheet';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useTheme } from '@/theme';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

const listTopPadding = 7.5;
const listBottomPadding = 9.5;
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

const Container = styled(View)({
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

const WalletFlatList: FlatList = styled(FlatList).attrs(({ showDividers }: { showDividers: boolean }) => ({
  contentContainerStyle: {
    paddingBottom: showDividers ? listBottomPadding : 0,
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

const EditButton = styled(ButtonPressAnimation).attrs(({ editMode }: { editMode: boolean }) => ({
  scaleTo: 0.96,
  wrapperStyle: {
    width: editMode ? 70 : 58,
  },
  width: editMode ? 100 : 100,
}))(
  IS_IOS
    ? {
        position: 'absolute',
        right: 20,
        top: -11,
      }
    : {
        elevation: 10,
        position: 'relative',
        right: 20,
        top: 6,
      }
);

const EditButtonLabel = styled(Text).attrs(({ theme: { colors }, editMode }: { theme: any; editMode: boolean }) => ({
  align: 'right',
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  size: 'large',
  weight: editMode ? 'bold' : 'semibold',
  numberOfLines: 1,
  ellipsizeMode: 'tail',
}))({
  height: 40,
});

const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = getExperimetalFlag(HARDWARE_WALLETS) ? 100 : 60;
const LIST_PADDING_BOTTOM = 6;
export const MAX_LIST_HEIGHT = DEVICE_HEIGHT - 220;
const WALLET_ROW_HEIGHT = 59;
const WATCH_ONLY_BOTTOM_PADDING = IS_ANDROID ? 20 : 0;

const getWalletListHeight = (numWallets: number, watchOnly: boolean) => {
  const baseHeight = !watchOnly ? FOOTER_HEIGHT + LIST_PADDING_BOTTOM + HEADER_HEIGHT : WATCH_ONLY_BOTTOM_PADDING;
  const paddingBetweenRows = 6 * (numWallets - 1);
  const rowHeight = WALLET_ROW_HEIGHT * numWallets;
  const calculatedHeight = baseHeight + rowHeight + paddingBetweenRows;
  return Math.min(calculatedHeight, MAX_LIST_HEIGHT);
};

interface Props {
  accountAddress: EthereumAddress;
  allWallets: ReturnType<typeof useWalletsWithBalancesAndNames>;
  contextMenuActions: EditWalletContextMenuActions;
  currentWallet: any;
  editMode: boolean;
  onPressEditMode: () => void;
  onChangeAccount: (walletId: string, address: EthereumAddress) => void;
  onPressAddAnotherWallet: () => void;
  onPressPairHardwareWallet: () => void;
  watchOnly: boolean;
}

export default function WalletList({
  accountAddress,
  allWallets,
  contextMenuActions,
  currentWallet,
  editMode,
  onPressEditMode,
  onChangeAccount,
  onPressAddAnotherWallet,
  onPressPairHardwareWallet,
  watchOnly,
}: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const scrollView = useRef(null);
  const { network } = useAccountSettings();
  const opacityAnimation = useSharedValue(0);
  const emptyOpacityAnimation = useSharedValue(1);
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const { colors } = useTheme();

  const containerHeight = useMemo(() => getWalletListHeight(rows.length, watchOnly), [rows.length, watchOnly]);

  // Update the rows when allWallets changes
  useEffect(() => {
    const seedRows: any[] = [];
    const privateKeyRows: any[] = [];
    const readOnlyRows: any[] = [];

    if (isEmpty(allWallets)) return;
    const sortedKeys = Object.keys(allWallets).sort();
    sortedKeys.forEach(key => {
      const wallet = allWallets[key];
      const filteredAccounts = (wallet.addresses || []).filter((account: any) => account.visible);
      filteredAccounts.forEach((account: any) => {
        const row = {
          ...account,
          editMode,
          height: WALLET_ROW_HEIGHT,
          id: account.address,
          isOnlyAddress: filteredAccounts.length === 1,
          isReadOnly: wallet.type === WalletTypes.readOnly,
          isLedger: wallet.type === WalletTypes.bluetooth,
          isSelected: accountAddress === account.address && (watchOnly || wallet?.id === currentWallet?.id),
          label: network !== Network.mainnet && account.ens === account.label ? address(account.address, 6, 4) : account.label,
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
    <Container height={containerHeight}>
      <Column height={HEADER_HEIGHT} justify="space-between">
        <Centered>
          <SheetTitle testID="change-wallet-sheet-title">{lang.t('wallet.label')}</SheetTitle>

          {!watchOnly && (
            <Row style={{ position: 'absolute', right: 0 }}>
              <EditButton editMode={editMode} onPress={onPressEditMode}>
                <EditButtonLabel editMode={editMode}>{editMode ? lang.t('button.done') : lang.t('button.edit')}</EditButtonLabel>
              </EditButton>
            </Row>
          )}
        </Centered>
        <Divider color={colors.rowDividerExtraLight} inset={[0, 15]} />
      </Column>
      <WalletsContainer style={opacityStyle}>
        <WalletFlatList
          data={rows}
          initialNumToRender={10}
          ref={scrollView}
          scrollEnabled={containerHeight >= MAX_LIST_HEIGHT}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <Animated.View style={[StyleSheet.absoluteFill, emptyOpacityStyle]}>
              <EmptyWalletList />
            </Animated.View>
          )}
        />
      </WalletsContainer>
      <WalletListDivider />
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
    </Container>
  );
}
