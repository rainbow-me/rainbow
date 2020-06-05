import { get, isEmpty } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Transition, Transitioning } from 'react-native-reanimated';
import WalletTypes from '../../helpers/walletTypes';
import { colors, position } from '../../styles';
import { EmptyAssetList } from '../asset-list';
import { Column } from '../layout';
import AddressRow from './AddressRow';
import WalletOption from './WalletOption';

const listTopPadding = 7.5;
const rowHeight = 59;

const RowTypes = {
  ADDRESS: 1,
  EMPTY: 2,
};

const sx = StyleSheet.create({
  container: {
    marginTop: -2,
  },
  flatList: {
    flex: 1,
    minHeight: 1,
    paddingTop: listTopPadding,
  },
  skeleton: {
    paddingTop: listTopPadding,
  },
});

const skeletonTransition = (
  <Transition.Sequence>
    <Transition.Out interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    <Transition.In durationMs={0.001} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

export default function WalletList({
  accountAddress,
  allWallets,
  currentWallet,
  editMode,
  height,
  onEditWallet,
  onPressAddAccount,
  onPressImportSeedPhrase,
  onChangeAccount,
  scrollEnabled,
}) {
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);
  const [doneScrolling, setDoneScrolling] = useState(false);
  const scrollView = useRef(null);
  const skeletonTransitionRef = useRef();

  // Update the rows when allWallets changes
  useEffect(() => {
    const seedRows = [];
    const privateKeyRows = [];
    const readOnlyRows = [];

    if (isEmpty(allWallets)) return;
    const sortedKeys = Object.keys(allWallets).sort();
    sortedKeys.forEach(key => {
      const wallet = allWallets[key];
      const filteredAccounts = wallet.addresses.filter(
        account => account.visible
      );
      filteredAccounts.forEach(account => {
        const row = {
          ...account,
          editMode,
          height: rowHeight,
          id: account.address,
          isOnlyAddress: filteredAccounts.length === 1,
          isReadOnly: wallet.type === WalletTypes.readOnly,
          isSelected:
            accountAddress === account.address &&
            wallet.id === get(currentWallet, 'id'),
          onPress: () => onChangeAccount(wallet.id, account.address),
          rowType: RowTypes.ADDRESS,
          wallet_id: wallet.id,
        };
        switch (wallet.type) {
          case WalletTypes.mnemonic:
          case WalletTypes.seed:
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
  }, [
    accountAddress,
    allWallets,
    currentWallet,
    editMode,
    onChangeAccount,
    onPressAddAccount,
  ]);

  // Update the data provider when rows change
  useEffect(() => {
    if (rows && rows.length && !ready) {
      setTimeout(() => {
        skeletonTransitionRef.current.animateNextTransition();
        setReady(true);
      }, 50);
    }
  }, [rows, ready]);

  useEffect(() => {
    // Detect if we need to autoscroll to the selected account
    let selectedItemIndex = 0;
    let distanceToScroll = 0;
    const scrollThreshold = rowHeight * 2;
    rows.some((item, index) => {
      if (item.isSelected) {
        selectedItemIndex = index;
        return true;
      }
      distanceToScroll += item.height;
      return false;
    });

    if (distanceToScroll > height - scrollThreshold && !doneScrolling) {
      setTimeout(() => {
        scrollView?.current?.scrollToIndex({
          animated: true,
          index: selectedItemIndex,
        });
        setDoneScrolling(true);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const getItemLayout = (data, index) => {
    const { height } = data[index];
    return {
      index,
      length: height,
      offset: height * index,
    };
  };

  const keyExtractor = item => item.id;

  const renderItem = useCallback(
    ({ item }) => {
      switch (item.rowType) {
        case RowTypes.ADDRESS:
          return (
            <Column height={item.height}>
              <AddressRow
                data={item}
                editMode={editMode}
                onEditWallet={onEditWallet}
                onPress={item.onPress}
              />
            </Column>
          );
        default:
          return null;
      }
    },
    [editMode, onEditWallet]
  );

  return (
    <View style={sx.container}>
      <View style={{ height }}>
        <Transitioning.View
          flex={1}
          ref={skeletonTransitionRef}
          transition={skeletonTransition}
        >
          {ready ? (
            <Fragment>
              <FlatList
                data={rows}
                style={sx.flatList}
                ref={scrollView}
                renderItem={renderItem}
                scrollEnabled={scrollEnabled}
                getItemLayout={getItemLayout}
                keyExtractor={keyExtractor}
                removeClippedSubviews
                initialNumToRender={rows.length}
              />
              <WalletOption
                editMode={editMode}
                icon="arrowBack"
                label="􀁍 Create a new wallet"
                onPress={onPressAddAccount}
              />
              <WalletOption
                editMode={editMode}
                icon="arrowBack"
                label="􀂍 Add an existing wallet"
                onPress={onPressImportSeedPhrase}
              />
            </Fragment>
          ) : (
            <EmptyAssetList
              {...position.coverAsObject}
              backgroundColor={colors.white}
              descendingOpacity
              pointerEvents="none"
              style={sx.skeleton}
            />
          )}
        </Transitioning.View>
      </View>
    </View>
  );
}
