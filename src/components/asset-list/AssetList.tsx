import React from 'react';
import { UniqueAsset } from '@/entities';
import useWalletSectionsData from '@/hooks/useWalletSectionsData';
import { Network } from '@/state/backendNetworks/types';
import RecyclerAssetList2, { AssetListType, RecyclerAssetList2Props } from './RecyclerAssetList2';

interface BaseAssetListProps {
  accentColor?: string;
  hideHeader?: boolean;
  isWalletEthZero?: boolean;
  network: Network;
}

type RecyclerList2Props = Omit<RecyclerAssetList2Props, 'accentColor' | 'walletBriefSectionsData'>;

interface AssetListProps extends BaseAssetListProps, RecyclerList2Props {
  externalAddress?: string;
  isLoading?: false;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
  showcase?: false;
  type?: AssetListType;
}

const AssetList = (props: AssetListProps) => {
  const { briefSectionsData: walletBriefSectionsData } = useWalletSectionsData({ type: 'wallet' });
  return <RecyclerAssetList2 accentColor={props.accentColor} walletBriefSectionsData={walletBriefSectionsData} />;
};

export default React.memo(AssetList);
