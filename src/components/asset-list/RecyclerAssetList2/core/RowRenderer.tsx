import React from 'react';
import { CoinDivider } from '../../../coin-divider';
import { AssetListHeader, AssetListItemSkeleton } from '../../index';
import WrappedNFT from '../WrappedNFT';
import WrappedPoolRow from '../WrappedPoolRow';
import WrappedPoolsListHeader from '../WrappedPoolsListHeader';
import WrappedSavingsListHeader from '../WrappedSavingsListHeader';
import WrappedSavingsRow from '../WrappedSavingsRow';
import WrappedTokenFamilyHeader from '../WrappedTokenFamilyHeader';
import WrapperBalanceCoinRow from '../WrapperBalanceCoinRow';
import { useAdditionalRecyclerAssetListData } from './Contexts';
import {
  AssetsHeaderExtraData,
  CellType,
  CoinDividerExtraData,
  CoinExtraData,
  NFTExtraData,
  NFTFamilyExtraData,
  PoolsHeaderExtraData,
  SavingExtraData,
  SavingsHeaderExtraData,
  UniswapPoolExtraData,
} from './ViewTypes';
import assertNever from '@rainbow-me/helpers/assertNever';

function CellDataProvider({
  uid,
  children,
}: {
  uid: string;
  children: (data: object) => React.ReactElement | null;
}) {
  const data = useAdditionalRecyclerAssetListData(uid);
  return children(data);
}

function rowRenderer(type: CellType, { uid }: { uid: string }) {
  return (
    <CellDataProvider key={uid} uid={uid}>
      {data => {
        switch (type) {
          case CellType.ASSETS_HEADER_SPACE_AFTER:
          case CellType.NFT_SPACE_AFTER:
          case CellType.NFTS_HEADER_SPACE_AFTER:
          case CellType.NFTS_HEADER_SPACE_BEFORE:
          case CellType.SAVINGS_HEADER_SPACE_BEFORE:
            return null;
          case CellType.COIN_DIVIDER:
            return (
              <CoinDivider
                balancesSum={(data as CoinDividerExtraData).value}
                defaultToEditButton={
                  (data as CoinDividerExtraData).defaultToEditButton
                }
              />
            );
          case CellType.ASSETS_HEADER:
            return (
              <AssetListHeader
                totalValue={(data as AssetsHeaderExtraData).value}
              />
            );
          case CellType.COIN:
            return (
              <WrapperBalanceCoinRow
                uniqueId={(data as CoinExtraData).uniqueId}
              />
            );
          case CellType.SAVINGS_HEADER:
            return (
              <WrappedSavingsListHeader
                // @ts-ignore
                value={(data as SavingsHeaderExtraData).value}
              />
            );
          case CellType.SAVINGS:
            return (
              <WrappedSavingsRow address={(data as SavingExtraData).address} />
            );
          case CellType.POOLS_HEADER:
            return (
              <WrappedPoolsListHeader
                value={(data as PoolsHeaderExtraData).value}
              />
            );
          case CellType.UNISWAP_POOL:
            return (
              <WrappedPoolRow
                address={(data as UniswapPoolExtraData).address}
              />
            );
          case CellType.NFTS_HEADER:
            return <AssetListHeader title="Collectibles" />;
          case CellType.FAMILY_HEADER: {
            const { name, image, total } = data as NFTFamilyExtraData;
            return (
              <WrappedTokenFamilyHeader
                image={image}
                name={name}
                total={total}
              />
            );
          }
          case CellType.NFT: {
            const { index, uniqueId } = data as NFTExtraData;

            return (
              <WrappedNFT
                placement={index % 2 === 0 ? 'left' : 'right'}
                uniqueId={uniqueId}
              />
            );
          }
          case CellType.LOADING_ASSETS:
            return <AssetListItemSkeleton />;
        }
        assertNever(type);
      }}
    </CellDataProvider>
  );
}

export default rowRenderer as (
  type: string | number,
  data: any
) => React.ReactElement;
