import lang from 'i18n-js';
import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { FabWrapperBottomPosition, FloatingActionButtonSize } from '../fab';
import { ListFooter } from '../list';
import EmptyAssetList from './EmptyAssetList';
import RecyclerAssetList from './RecyclerAssetList';
import RecyclerAssetList2 from './RecyclerAssetList2';

const FabSizeWithPadding =
  FloatingActionButtonSize + FabWrapperBottomPosition * 2;

const AssetList = ({
  hideHeader,
  isEmpty,
  isLoading,
  isWalletEthZero,
  network,
  scrollViewTracker,
  sections,
  walletBriefSectionsData,
  ...props
}) => {
  const insets = useSafeArea();

  return isEmpty || isLoading ? (
    <EmptyAssetList
      {...props}
      hideHeader={hideHeader}
      isLoading={isLoading}
      isWalletEthZero={isWalletEthZero}
      network={network}
      title={lang.t('account.tab_balances')}
    />
  ) : props.showcase ? (
    <RecyclerAssetList
      hideHeader={hideHeader}
      paddingBottom={
        insets.bottom + FabSizeWithPadding - ListFooter.height + (android && 60)
      }
      scrollViewTracker={scrollViewTracker}
      sections={sections}
      {...props}
    />
  ) : (
    <RecyclerAssetList2 walletBriefSectionsData={walletBriefSectionsData} />
  );
};

export default React.memo(AssetList);
