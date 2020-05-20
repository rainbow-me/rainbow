import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import WalletTypes from '../../helpers/walletTypes';
import { deviceUtils } from '../../utils';
import AddressOption from './AddressOption';
import AddressRow from './AddressRow';
import WalletDivider from './WalletDivider';
import WalletOption from './WalletOption';

const rowHeight = 70;
const optionRowHeight = 50;
const lastRowPadding = 10;

const RowTypes = {
  ADDRESS: 1,
  ADDRESS_OPTION: 2,
  EMPTY: 3,
  LAST_ROW: 4,
};

const sx = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
});

export function WalletList({
  accountAddress,
  allWallets,
  currentWallet,
  editMode,
  height,
  onEditWallet,
  onPressAddAccount,
  onPressImportSeedPhrase,
  onChangeAccount,
}) {
  const [rows, setRows] = useState([]);
  const [dataProvider, setDataProvider] = useState(null);
  const [layoutProvider, setLayoutProvider] = useState(null);
  const [doneScrolling, setDoneScrolling] = useState(false);
  const scrollView = useRef(null);

  // Update the rows when allWallets changes
  useEffect(() => {
    let newRows = [];
    if (!allWallets) return;
    Object.keys(allWallets).forEach(key => {
      const wallet = allWallets[key];
      const filteredAccounts = wallet.addresses.filter(
        account => account.visible
      );
      filteredAccounts.forEach(account => {
        newRows.push({
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
        });
      });
      // You can't add accounts for read only or private key wallets
      if (
        [WalletTypes.mnemonic, WalletTypes.seed].indexOf(wallet.type) !== -1 &&
        filteredAccounts.length > 0
      ) {
        newRows.push({
          editMode,
          height: optionRowHeight,
          icon: 'plus',
          id: 'add_account',
          label: 'Create a new wallet',
          onPress: () => onPressAddAccount(wallet.id),
          rowType: RowTypes.ADDRESS_OPTION,
        });
      }
    });
    setRows(newRows);

    setLayoutProvider(
      new LayoutProvider(
        i => {
          if (!newRows || !newRows.length) return RowTypes.EMPTY;
          return (newRows[i] && newRows[i].rowType) || RowTypes.EMPTY;
        },
        (type, dim) => {
          if (type === RowTypes.ADDRESS) {
            dim.width = deviceUtils.dimensions.width;
            dim.height = rowHeight;
          } else if (type === RowTypes.ADDRESS_OPTION) {
            dim.width = deviceUtils.dimensions.width;
            dim.height = optionRowHeight;
          } else if (type === RowTypes.LAST_ROW) {
            dim.width = deviceUtils.dimensions.width;
            dim.height = rowHeight + lastRowPadding;
          } else {
            dim.width = 0;
            dim.height = 0;
          }
        }
      )
    );
  }, [
    accountAddress,
    allWallets,
    currentWallet,
    editMode,
    onChangeAccount,
    onPressAddAccount,
    onPressImportSeedPhrase,
  ]);

  // Update the data provider when rows change
  useEffect(() => {
    const dataProvider = new DataProvider((r1, r2) => {
      if (r1.rowType !== r2.rowType) {
        return true;
      }

      if (r1.id !== r2.id) {
        return true;
      }

      if (r1.name !== r2.name) {
        return true;
      }

      if (r1.label !== r2.label) {
        return true;
      }

      if (r1.color !== r2.color) {
        return true;
      }

      if (r1.isSelected !== r2.isSelected) {
        return true;
      }
      if (r1.editMode !== r2.editMode) {
        return true;
      }

      return false;
    }).cloneWithRows(rows);
    setDataProvider(dataProvider);

    // Detect if we need to autoscroll to the selected account
    let distanceToScroll = 0;
    rows.some(item => {
      if (item.isSelected) {
        return true;
      }
      distanceToScroll += item.height;
      return false;
    });
    if (distanceToScroll > height - rowHeight && !doneScrolling) {
      setDoneScrolling(true);
      setTimeout(() => {
        scrollView &&
          scrollView.current &&
          scrollView.current.scrollToOffset(0, distanceToScroll, true);
      }, 300);
    }
  }, [doneScrolling, height, rows]);

  const renderRow = useCallback(
    (_, data, index) => {
      const isLastRow = index === rows.length - 1;

      switch (data.rowType) {
        case RowTypes.ADDRESS_OPTION:
          return (
            <AddressOption
              icon={data.icon}
              label={data.label}
              onPress={data.onPress}
              borderBottom={!isLastRow}
              editMode={editMode}
            />
          );
        case RowTypes.ADDRESS:
          return (
            <AddressRow
              data={data}
              onPress={data.onPress}
              onEditWallet={onEditWallet}
              borderBottom={data.isOnlyAddress && data.isReadOnly && !isLastRow}
              editMode={editMode}
            />
          );
        default:
          return null;
      }
    },
    [editMode, onEditWallet, rows.length]
  );
  if (!dataProvider) return null;
  return (
    <View style={sx.container}>
      <WalletDivider />
      <View style={{ height }}>
        <RecyclerListView
          style={{ flex: 1 }}
          rowRenderer={renderRow}
          dataProvider={dataProvider}
          layoutProvider={layoutProvider}
          optimizeForInsertDeleteAnimations
          ref={scrollView}
        />
      </View>
      <WalletOption
        icon="arrowBack"
        label="Add an existing wallet"
        onPress={onPressImportSeedPhrase}
        editMode={editMode}
      />
    </View>
  );
}

export default WalletList;

WalletList.propTypes = {
  accountAddress: PropTypes.string,
  allWallets: PropTypes.object,
  currentWallet: PropTypes.object,
  height: PropTypes.number,
  onChangeAccount: PropTypes.func,
  onEditWallet: PropTypes.func,
  onPressAddAccount: PropTypes.func,
  onPressImportSeedPhrase: PropTypes.func,
};
