import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FabWrapperBottomPosition, FloatingActionButtonSize } from '../fab';
import RecyclerAssetList, { RecyclerAssetListProps, RecyclerAssetListSection } from './RecyclerAssetList';
import RecyclerAssetList2, { AssetListType, RecyclerAssetList2Props } from './RecyclerAssetList2';
import EmptyAssetList, { EmptyAssetListProps } from './EmptyAssetList';
import * as i18n from '@/languages';
import { UniqueAsset } from '@/entities';
import { ListFooterHeight } from '../list/ListFooter';
import { useWalletSectionsData } from '@/hooks';
import { IS_ANDROID } from '@/env';
import { ViewableItemsChangedCallback } from './RecyclerAssetList2/core/RawRecyclerList';

const FabSizeWithPadding = FloatingActionButtonSize + FabWrapperBottomPosition * 2;

interface BaseAssetListProps {
  accentColor?: string;
  hideHeader?: boolean;
  isWalletEthZero?: boolean;
  network: string;
  scrollViewTracker?: any;
}

type AssetListEmpty = Omit<EmptyAssetListProps, 'isLoading' | 'network' | 'isWalletEthZero'>;
type RecyclerList = Omit<RecyclerAssetListProps, 'hideHeader' | 'sections'>;
type RecyclerList2 = Omit<RecyclerAssetList2Props, 'accentColor' | 'walletBriefSectionsData'>;

interface LoadingProps extends BaseAssetListProps, AssetListEmpty {
  isLoading: boolean;
  showcase?: boolean;
  disableRefreshControl?: boolean;
}

interface ShowcaseProps extends Omit<BaseAssetListProps, 'walletBriefSectionsData'>, Omit<RecyclerList, 'colors'> {
  isLoading?: false;
  isReadOnlyWallet?: boolean;
  openFamilies?: boolean;
  showcase: true;
  sections: readonly RecyclerAssetListSection[];
  colors?: RecyclerAssetListProps['colors'];
}

interface DefaultProps extends BaseAssetListProps, RecyclerList2 {
  isLoading?: false;
  showcase?: false;
  disablePullDownToRefresh?: boolean;
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
  type?: AssetListType;
  walletBriefSectionsData: ReturnType<typeof useWalletSectionsData>['briefSectionsData'];
  onEndReached?: () => void;
  onViewableItemsChanged?: ViewableItemsChangedCallback;
}

type AssetListProps = LoadingProps | ShowcaseProps | DefaultProps;

function isShowcaseProps(p: AssetListProps): p is ShowcaseProps {
  return p.showcase === true;
}

function isDefaultProps(p: AssetListProps): p is DefaultProps {
  return !p.isLoading && !p.showcase;
}

const AssetList = (props: AssetListProps) => {
  const insets = useSafeAreaInsets();

  if (props.isLoading) {
    const { isLoading, ...restProps } = props;
    return (
      <EmptyAssetList
        hideHeader={props.hideHeader}
        isLoading={true}
        isWalletEthZero={props.isWalletEthZero || false}
        title={i18n.t(i18n.l.account.tokens)}
        {...restProps}
      />
    );
  } else if (isShowcaseProps(props)) {
    const { sections, hideHeader, ...restProps } = props;
    return (
      <RecyclerAssetList
        hideHeader={!!hideHeader}
        paddingBottom={insets.bottom + FabSizeWithPadding - ListFooterHeight + (IS_ANDROID ? 60 : 0)}
        sections={sections}
        {...restProps}
      />
    );
  } else if (isDefaultProps(props)) {
    return (
      <RecyclerAssetList2
        accentColor={props.accentColor}
        walletBriefSectionsData={props.walletBriefSectionsData}
        disablePullDownToRefresh={props.disablePullDownToRefresh}
        externalAddress={props.externalAddress}
        onEndReached={props.onEndReached}
        onPressUniqueToken={props.onPressUniqueToken}
        type={props.type}
        onViewableItemsChanged={props.onViewableItemsChanged}
      />
    );
  }

  return null;
};

export default React.memo(AssetList);
