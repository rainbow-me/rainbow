import { get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import WalletTypes from '../../helpers/walletTypes';
import { colors, position } from '../../styles';
import { deviceUtils } from '../../utils';
import Divider from '../Divider';
import { EmptyAssetList } from '../asset-list';
import { Column } from '../layout';
import AddressOption from './AddressOption';
import AddressRow from './AddressRow';
import WalletOption from './WalletOption';

const listTopPadding = 7.5;
const optionRowHeight = 55;
const rowHeight = 59;

const RowTypes = {
  ADDRESS: 1,
  ADDRESS_OPTION: 2,
  EMPTY: 3,
};

const sx = StyleSheet.create({
  container: {
    marginTop: -2,
  },
  rlv: {
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
  scrollEnabled,
}) {
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);
  const [dataProvider, setDataProvider] = useState(null);
  const [layoutProvider, setLayoutProvider] = useState(null);
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

      // You can't add accounts for read only or private key wallets
      if (
        [WalletTypes.mnemonic, WalletTypes.seed].indexOf(wallet.type) !== -1 &&
        filteredAccounts.length > 0
      ) {
        seedRows.push({
          editMode,
          height: optionRowHeight,
          id: 'add_account',
          label: '􀁍 Create a new wallet',
          onPress: () => onPressAddAccount(wallet.id),
          rowType: RowTypes.ADDRESS_OPTION,
        });
      }
    });

    const newRows = [...seedRows, ...privateKeyRows, ...readOnlyRows];

    // You should always be able to create a new wallet
    // for ex. if you only import pkey or read only wallet
    const canCreateAccount = newRows.find(
      r => r.rowType === RowTypes.ADDRESS_OPTION
    );
    if (!canCreateAccount) {
      newRows.push({
        editMode,
        height: optionRowHeight,
        id: 'add_account',
        label: '􀁍 Create a new wallet',
        onPress: () => onPressAddAccount(),
        rowType: RowTypes.ADDRESS_OPTION,
      });
    }

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
  }, [doneScrolling, height, ready, rows]);

  useEffect(() => {
    if (layoutProvider && dataProvider && !ready) {
      skeletonTransitionRef.current.animateNextTransition();
      setReady(true);
    }
  }, [dataProvider, layoutProvider, ready]);

  useEffect(() => {
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
      setTimeout(() => {
        scrollView &&
          scrollView.current &&
          scrollView.current.scrollToOffset(0, distanceToScroll, true);
        setDoneScrolling(true);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const renderRow = useCallback(
    (_, data, index) => {
      const isLastRow = index === rows.length - 1;

      switch (data.rowType) {
        case RowTypes.ADDRESS_OPTION:
          return (
            <Column>
              <AddressOption
                editMode={editMode}
                label={data.label}
                onPress={data.onPress}
              />
              {!isLastRow && (
                <Divider
                  color={colors.rowDividerExtraLight}
                  inset={[0, 19, 0, 19]}
                />
              )}
            </Column>
          );
        case RowTypes.ADDRESS:
          return (
            <AddressRow
              data={data}
              editMode={editMode}
              onEditWallet={onEditWallet}
              onPress={data.onPress}
            />
          );
        default:
          return null;
      }
    },
    [editMode, onEditWallet, rows.length]
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
              <RecyclerListView
                dataProvider={dataProvider}
                layoutProvider={layoutProvider}
                optimizeForInsertDeleteAnimations
                ref={scrollView}
                rowRenderer={renderRow}
                scrollEnabled={scrollEnabled}
                style={sx.rlv}
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
  scrollEnabled: PropTypes.bool,
};
