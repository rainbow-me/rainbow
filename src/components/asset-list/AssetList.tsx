import lang from 'i18n-js';
import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { magicMemo } from '../../utils';
import { FabWrapperBottomPosition, FloatingActionButtonSize } from '../fab';
import { ListFooter } from '../list';
// @ts-expect-error ts-migrate(6142) FIXME: Module './EmptyAssetList' was resolved to '/Users/... Remove this comment to see the full error message
import EmptyAssetList from './EmptyAssetList';
// @ts-expect-error ts-migrate(6142) FIXME: Module './RecyclerAssetList' was resolved to '/Use... Remove this comment to see the full error message
import RecyclerAssetList from './RecyclerAssetList';

const FabSizeWithPadding =
  FloatingActionButtonSize + FabWrapperBottomPosition * 2;

const AssetList = ({
  fetchData,
  hideHeader,
  isEmpty,
  isWalletEthZero,
  network,
  scrollViewTracker,
  sections,
  ...props
}: any) => {
  const insets = useSafeArea();

  return isEmpty ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <EmptyAssetList
      {...props}
      hideHeader={hideHeader}
      isWalletEthZero={isWalletEthZero}
      network={network}
      title={lang.t('account.tab_balances')}
    />
  ) : (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RecyclerAssetList
      fetchData={fetchData}
      hideHeader={hideHeader}
      isBlockingUpdate={isBlockingUpdate}
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MemoExot... Remove this comment to see the full error message
      paddingBottom={insets.bottom + FabSizeWithPadding - ListFooter.height}
      scrollViewTracker={scrollViewTracker}
      sections={sections}
      {...props}
    />
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(AssetList, ['isEmpty', 'isWalletEthZero', 'sections']);
