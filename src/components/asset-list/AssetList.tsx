import lang from 'i18n-js';
import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { magicMemo } from '../../utils';
import { FabWrapperBottomPosition, FloatingActionButtonSize } from '../fab';
import { ListFooter } from '../list';
import EmptyAssetList from './EmptyAssetList';
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
}) => {
  const insets = useSafeArea();

  return isEmpty ? (
    <EmptyAssetList
      {...props}
      hideHeader={hideHeader}
      isWalletEthZero={isWalletEthZero}
      network={network}
      title={lang.t('account.tab_balances')}
    />
  ) : (
    <RecyclerAssetList
      fetchData={fetchData}
      hideHeader={hideHeader}
      paddingBottom={insets.bottom + FabSizeWithPadding - ListFooter.height}
      scrollViewTracker={scrollViewTracker}
      sections={sections}
      {...props}
    />
  );
};

export default magicMemo(AssetList, ['isEmpty', 'isWalletEthZero', 'sections']);
