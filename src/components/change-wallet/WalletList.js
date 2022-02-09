import lang from 'i18n-js';
import { get, isEmpty } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { Transition, Transitioning } from 'react-native-reanimated';
import networkTypes from '../../helpers/networkTypes';
import WalletTypes from '../../helpers/walletTypes';
import { address } from '../../utils/abbreviations';
import Divider from '../Divider';
import { EmptyAssetList } from '../asset-list';
import { Column } from '../layout';
import AddressRow from './AddressRow';
import WalletOption from './WalletOption';
import { useAccountSettings } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const listTopPadding = 7.5;
const rowHeight = 59;

const RowTypes = {
  ADDRESS: 1,
  EMPTY: 2,
};

const getItemLayout = (data, index) => {
  const { height } = data[index];
  return {
    index,
    length: height,
    offset: height * index,
  };
};

const keyExtractor = item => `${item.walletId}-${item?.id}`;

const skeletonTransition = (
  <Transition.Sequence>
    <Transition.Out interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    <Transition.In durationMs={0.001} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const Container = styled(Transitioning.View)({
  height: ({ height }) => height,
  marginTop: -2,
});

const EmptyWalletList = styled(EmptyAssetList).attrs({
  descendingOpacity: true,
  pointerEvents: 'none',
})({
  ...position.coverAsObject,
  backgroundColor: ({ theme: { colors } }) => colors.white,
  paddingTop: listTopPadding,
});

const WalletFlatList = styled(FlatList).attrs(({ showDividers }) => ({
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

const WalletListDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  color: colors.rowDividerExtraLight,
  inset: [0, 15],
}))({
  marginBottom: 1,
  marginTop: -1,
});

const WalletListFooter = styled(Column)({
  paddingBottom: 6,
  paddingTop: 4,
});

export default function WalletList({
  accountAddress,
  allWallets,
  currentWallet,
  editMode,
  height,
  onChangeAccount,
  onEditWallet,
  onPressAddAccount,
  onPressImportSeedPhrase,
  scrollEnabled,
  showDividers,
  watchOnly,
}) {
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);
  const scrollView = useRef(null);
  const skeletonTransitionRef = useRef();
  const { network } = useAccountSettings();

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
            (watchOnly || wallet?.id === get(currentWallet, 'id')),
          label:
            network !== networkTypes.mainnet && account.ens === account.label
              ? address(account.address, 6, 4)
              : account.label,
          onPress: () => onChangeAccount(wallet?.id, account.address),
          rowType: RowTypes.ADDRESS,
          walletId: wallet?.id,
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
    network,
    onChangeAccount,
    onPressAddAccount,
    watchOnly,
  ]);

  // Update the data provider when rows change
  useEffect(() => {
    if (rows && rows.length && !ready) {
      setTimeout(() => {
        if (ios) {
          skeletonTransitionRef.current?.animateNextTransition();
        }
        setReady(true);
      }, 50);
    }
  }, [rows, ready]);

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
                watchOnly={watchOnly}
              />
            </Column>
          );
        default:
          return null;
      }
    },
    [editMode, onEditWallet, watchOnly]
  );

  return (
    <Container
      height={height}
      ref={skeletonTransitionRef}
      transition={skeletonTransition}
    >
      {ready ? (
        <Fragment>
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
            <WalletListFooter>
              <WalletOption
                editMode={editMode}
                icon="arrowBack"
                label={`􀁍 ${lang.t('wallet.action.create_new')}`}
                onPress={onPressAddAccount}
              />
              <WalletOption
                editMode={editMode}
                icon="arrowBack"
                label={`􀂍 ${lang.t('wallet.action.add_existing')}`}
                onPress={onPressImportSeedPhrase}
              />
            </WalletListFooter>
          )}
        </Fragment>
      ) : (
        <EmptyWalletList />
      )}
    </Container>
  );
}
