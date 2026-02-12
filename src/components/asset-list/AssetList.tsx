import React from 'react';
import RecyclerAssetList2, { AssetListType, RecyclerAssetList2Props } from './RecyclerAssetList2';
import EmptyAssetList, { EmptyAssetListProps } from './EmptyAssetList';
import * as i18n from '@/languages';
import { UniqueAsset } from '@/entities';
import useWalletSectionsData from '@/hooks/useWalletSectionsData';
import { ViewableItemsChangedCallback } from './RecyclerAssetList2/core/RawRecyclerList';

interface BaseAssetListProps {
  accentColor?: string;
  hideHeader?: boolean;
  isWalletEthZero?: boolean;
  network: string;
  scrollViewTracker?: any;
}

type AssetListEmpty = Omit<EmptyAssetListProps, 'isLoading' | 'network' | 'isWalletEthZero'>;
type RecyclerList2 = Omit<RecyclerAssetList2Props, 'accentColor' | 'walletBriefSectionsData'>;

interface LoadingProps extends BaseAssetListProps, AssetListEmpty {
  isLoading: boolean;
  disableRefreshControl?: boolean;
}

interface DefaultProps extends BaseAssetListProps, RecyclerList2 {
  isLoading?: false;
  disablePullDownToRefresh?: boolean;
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
  type?: AssetListType;
  walletBriefSectionsData: ReturnType<typeof useWalletSectionsData>['briefSectionsData'];
  onEndReached?: () => void;
  onViewableItemsChanged?: ViewableItemsChangedCallback;
}

type AssetListProps = LoadingProps | DefaultProps;

function isDefaultProps(p: AssetListProps): p is DefaultProps {
  return !p.isLoading;
}

const AssetList = (props: AssetListProps) => {
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
