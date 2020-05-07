import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
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
import WalletRow from './WalletRow';

const rowHeight = 50;
const padding = 10;
const lastRowPadding = 10;

const RowTypes = {
  ADDRESS: 0,
  ADDRESS_OPTION: 1,
  WALLET: 2,
  WALLET_OPTION: 3,
  // eslint-disable-next-line sort-keys
  LAST_ROW: 4,
};

const sx = StyleSheet.create({
  container: {
    paddingTop: 2,
  },
});

export function WalletList({
  accountAddress,
  allWallets,
  currentWallet,
  height,
  onEditAddress,
  onEditWallet,
  onPressAddAccount,
  onPressImportSeedPhrase,
  onChangeAccount,
}) {
  const { goBack } = useNavigation();
  const [rows, setRows] = useState([]);
  const [dataProvider, setDataProvider] = useState(null);
  const [layoutProvider, setLayoutProvider] = useState(null);
  const [doneScrolling, setDoneScrolling] = useState(false);
  const scrollView = useRef(null);

  // Update the rows when allWallets changes
  useEffect(() => {
    let rows = [];
    if (!allWallets) return;
    Object.keys(allWallets).forEach(key => {
      const wallet = allWallets[key];
      // If there's more than account we group them by wallet
      let isOnlyAddress = true;
      const filteredAccounts = wallet.addresses.filter(
        account => account.visible
      );
      if (filteredAccounts.length > 1) {
        isOnlyAddress = false;
        rows.push({ ...wallet, rowType: RowTypes.WALLET });
      }
      filteredAccounts.forEach(account => {
        rows.push({
          ...account,
          id: account.address,
          isOnlyAddress,
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
        [WalletTypes.mnemonic, WalletTypes.seed].indexOf(wallet.type) !== -1
      ) {
        rows.push({
          icon: 'plus',
          id: 'add_account',
          label: 'Add account',
          onPress: () => onPressAddAccount(wallet.id),
          rowType: RowTypes.ADDRESS_OPTION,
        });
      }
    });
    rows.push({
      icon: 'arrowBack',
      id: 'import_wallet',
      label: 'Import a Wallet',
      onPress: onPressImportSeedPhrase,
      rowType: RowTypes.WALLET_OPTION,
    });
    setRows(rows);
  }, [
    accountAddress,
    allWallets,
    currentWallet,
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

      return false;
    }).cloneWithRows(rows);
    setDataProvider(dataProvider);

    // Detect if we need to autoscroll to the selected account
    let selectedRow = 0;
    rows.some((item, i) => {
      if (item.isSelected) {
        selectedRow = i;
        return true;
      }
      return false;
    });

    if (selectedRow > 4 && !doneScrolling) {
      setDoneScrolling(true);
      setTimeout(() => {
        scrollView &&
          scrollView.current &&
          scrollView.current.scrollToOffset(
            0,
            selectedRow * (rowHeight + padding) - padding,
            true
          );
      }, 300);
    }
  }, [doneScrolling, rows]);

  useEffect(() => {
    setLayoutProvider(
      new LayoutProvider(
        i => {
          if (!rows || !rows.length) return RowTypes.WALLET;
          if (i === rows.length - 1) {
            return RowTypes.LAST_ROW;
          } else {
            return rows[i].rowType;
          }
        },
        (type, dim) => {
          if (type === RowTypes.WALLET) {
            dim.width = deviceUtils.dimensions.width;
            dim.height = rowHeight + 10;
          } else if (type === RowTypes.WALLET_OPTION) {
            dim.width = deviceUtils.dimensions.width;
            dim.height = rowHeight;
          } else if (type === RowTypes.ADDRESS) {
            dim.width = deviceUtils.dimensions.width;
            dim.height = rowHeight;
          } else if (type === RowTypes.ADDRESS_OPTION) {
            dim.width = deviceUtils.dimensions.width;
            dim.height = rowHeight;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem = useCallback(
    item => {
      switch (item.rowType) {
        case RowTypes.WALLET_OPTION:
          return (
            <WalletOption
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
            />
          );
        case RowTypes.ADDRESS_OPTION:
          return (
            <AddressOption
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
            />
          );
        case RowTypes.WALLET:
          return (
            <WalletRow
              id={item.id}
              accountName={item.name}
              accountColor={item.color}
              onPress={goBack}
              onEditWallet={onEditWallet}
            />
          );
        case RowTypes.ADDRESS:
          return (
            <AddressRow
              data={item}
              onPress={item.onPress}
              onEditAddress={onEditAddress}
            />
          );
        default:
          return null;
      }
    },
    [goBack, onEditAddress, onEditWallet]
  );

  const renderRow = useCallback(
    (_, data) => {
      return renderItem(data);
    },
    [renderItem]
  );
  if (!dataProvider) return null;
  return (
    <View style={sx.container}>
      <WalletDivider />
      <View style={{ height }}>
        <RecyclerListView
          style={{ flex: 1, height }}
          rowRenderer={renderRow}
          dataProvider={dataProvider}
          layoutProvider={layoutProvider}
          optimizeForInsertDeleteAnimations
          ref={scrollView}
        />
      </View>
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
  onEditAddress: PropTypes.func,
  onEditWallet: PropTypes.func,
  onPressAddAccount: PropTypes.func,
  onPressImportSeedPhrase: PropTypes.func,
};
