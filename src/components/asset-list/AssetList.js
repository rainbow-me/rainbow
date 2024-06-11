import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FabWrapperBottomPosition, FloatingActionButtonSize } from '../fab';
import { ListFooter } from '../list';
import RecyclerAssetList from './RecyclerAssetList';
import RecyclerAssetList2 from './RecyclerAssetList2';
import EmptyAssetList from './EmptyAssetList';
import * as i18n from '@/languages';

const FabSizeWithPadding = FloatingActionButtonSize + FabWrapperBottomPosition * 2;

const AssetList = ({
  accentColor,
  hideHeader,
  isLoading,
  isWalletEthZero,
  network,
  scrollViewTracker,
  sections,
  walletBriefSectionsData,
  ...props
}) => {
  const insets = useSafeAreaInsets();

  return isLoading ? (
    <EmptyAssetList
      {...props}
      hideHeader={hideHeader}
      isLoading={isLoading}
      isWalletEthZero={isWalletEthZero}
      network={network}
      title={i18n.t(i18n.l.account.tab_balances)}
    />
  ) : props.showcase ? (
    <RecyclerAssetList
      hideHeader={hideHeader}
      paddingBottom={insets.bottom + FabSizeWithPadding - ListFooter.height + (android && 60)}
      scrollViewTracker={scrollViewTracker}
      sections={sections}
      {...props}
    />
  ) : (
    <RecyclerAssetList2 accentColor={accentColor} walletBriefSectionsData={walletBriefSectionsData} />
  );
};

export default React.memo(AssetList);
