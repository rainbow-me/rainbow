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
import styled from 'styled-components';
import networkTypes from '../../helpers/networkTypes';
import WalletTypes from '../../helpers/walletTypes';
import { address } from '../../utils/abbreviations';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { EmptyAssetList } from '../asset-list';
import { Column } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AddressRow' was resolved to '/Users/nick... Remove this comment to see the full error message
import AddressRow from './AddressRow';
// @ts-expect-error ts-migrate(6142) FIXME: Module './WalletOption' was resolved to '/Users/ni... Remove this comment to see the full error message
import WalletOption from './WalletOption';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const listTopPadding = 7.5;
const rowHeight = 59;

const RowTypes = {
  ADDRESS: 1,
  EMPTY: 2,
};

const getItemLayout = (data: any, index: any) => {
  const { height } = data[index];
  return {
    index,
    length: height,
    offset: height * index,
  };
};

const keyExtractor = (item: any) => `${item.walletId}-${item?.id}`;

const skeletonTransition = (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Transition.Sequence>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Out interpolation="easeOut" type="fade" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.In durationMs={0.001} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const Container = styled(Transitioning.View)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'Transiti... Remove this comment to see the full error message
  height: ${({ height }) => height};
  margin-top: -2;
`;

const EmptyWalletList = styled(EmptyAssetList).attrs({
  descendingOpacity: true,
  pointerEvents: 'none',
})`
  ${position.cover};
  background-color: ${({ theme: { colors } }) => colors.white};
  padding-top: ${listTopPadding};
`;

// @ts-expect-error ts-migrate(2339) FIXME: Property 'showDividers' does not exist on type 'Fl... Remove this comment to see the full error message
const WalletFlatList = styled(FlatList).attrs(({ showDividers }) => ({
  contentContainerStyle: {
    paddingBottom: showDividers ? 9.5 : 0,
    paddingTop: listTopPadding,
  },
  getItemLayout,
  keyExtractor,
  removeClippedSubviews: true,
}))`
  flex: 1;
  min-height: 1;
`;

const WalletListDivider = styled(Divider).attrs(({ theme: { colors } }) => ({
  color: colors.rowDividerExtraLight,
  inset: [0, 15],
}))`
  margin-bottom: 1;
  margin-top: -1;
`;

const WalletListFooter = styled(Column)`
  padding-bottom: 6;
  padding-top: 4;
`;

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
}: any) {
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);
  const [doneScrolling, setDoneScrolling] = useState(false);
  const scrollView = useRef(null);
  const skeletonTransitionRef = useRef();
  const { network } = useAccountSettings();

  // Update the rows when allWallets changes
  useEffect(() => {
    const seedRows: any = [];
    const privateKeyRows: any = [];
    const readOnlyRows: any = [];

    if (isEmpty(allWallets)) return;
    const sortedKeys = Object.keys(allWallets).sort();
    sortedKeys.forEach(key => {
      const wallet = allWallets[key];
      const filteredAccounts = wallet.addresses.filter(
        (account: any) => account.visible
      );
      filteredAccounts.forEach((account: any) => {
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
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any[]' is not assignable to para... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        if (ios) {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'animateNextTransition' does not exist on... Remove this comment to see the full error message
          skeletonTransitionRef.current?.animateNextTransition();
        }
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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSelected' does not exist on type 'neve... Remove this comment to see the full error message
      if (item.isSelected) {
        selectedItemIndex = index;
        return true;
      }
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'never'.
      distanceToScroll += item.height;
      return false;
    });

    if (distanceToScroll > height - scrollThreshold && !doneScrolling) {
      setTimeout(() => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollToIndex' does not exist on type 'n... Remove this comment to see the full error message
        scrollView.current?.scrollToIndex({
          animated: true,
          index: selectedItemIndex,
        });
        setDoneScrolling(true);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const renderItem = useCallback(
    ({ item }) => {
      switch (item.rowType) {
        case RowTypes.ADDRESS:
          return (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Column height={item.height}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      height={height}
      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      ref={skeletonTransitionRef}
      transition={skeletonTransition}
    >
      {ready ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Fragment>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <WalletFlatList
            data={rows}
            initialNumToRender={rows.length}
            ref={scrollView}
            renderItem={renderItem}
            scrollEnabled={scrollEnabled}
            // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
            showDividers={showDividers}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {showDividers && <WalletListDivider />}
          {!watchOnly && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <WalletListFooter>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <WalletOption
                editMode={editMode}
                icon="arrowBack"
                label="􀁍 Create a new wallet"
                onPress={onPressAddAccount}
              />
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <WalletOption
                editMode={editMode}
                icon="arrowBack"
                label="􀂍 Add an existing wallet"
                onPress={onPressImportSeedPhrase}
              />
            </WalletListFooter>
          )}
        </Fragment>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <EmptyWalletList />
      )}
    </Container>
  );
}
