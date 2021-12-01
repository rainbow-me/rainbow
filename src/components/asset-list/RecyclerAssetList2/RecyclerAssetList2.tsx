import equal from 'fast-deep-equal';
import React, { Component, useMemo, useRef } from 'react';
import { Dimensions, View } from 'react-native';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import { useDeepCompareMemo } from 'use-deep-compare';
import { CoinDivider, CoinDividerHeight } from '../../coin-divider';
import {BalanceCoinRow, CoinRowHeight} from '../../coin-row';
import { UniqueTokenRow } from '../../unique-token';
import { AssetListHeaderHeight } from '../AssetListHeader';
import { Text } from '@rainbow-me/design-system';
import assertNever from '@rainbow-me/helpers/assertNever';
import { useWalletSectionsData } from '@rainbow-me/hooks';
import {AssetListHeader} from "../index";
import WrapperBalanceCoinRow from "./WrapperBalanceCoinRow";

enum CellType {
  ASSETS_HEADER = 'ASSETS_HEADER',
  COIN = 'COIN',
  COIN_DIVIDER = 'COIN_DIVIDER',
  SAVINGS_HEADER = 'SAVINGS_HEADER',
  SAVINGS = 'SAVINGS',
  POOLS_HEADER = 'POOLS_HEADER',
  UNISWAP_POOL = 'UNISWAP_POOL',
  NFTS_HEADER = 'NFTS_HEADER',
  FAMILY_HEADER = 'FAMILY_HEADER',
  NFT = 'NFT',
  LOADING_ASSETS = 'LOADING_ASSETS',
}

type Dim = {
  width?: number;
  height: number;
};

interface DimMAp {
  [name: CellType];
}

const ViewDimensions: Record<CellType, Dim> = {
  [CellType.ASSETS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.COIN]: { height: CoinRowHeight },
  [CellType.COIN_DIVIDER]: { height: CoinDividerHeight },
  [CellType.SAVINGS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.SAVINGS]: { height: CoinRowHeight },
  [CellType.POOLS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.UNISWAP_POOL]: { height: CoinRowHeight },
  [CellType.NFTS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.FAMILY_HEADER]: { height: AssetListHeaderHeight },
  // @ts-ignore
  [CellType.NFT]: { height: UniqueTokenRow.cardSize },
  [CellType.LOADING_ASSETS]: { height: AssetListHeaderHeight },
};

type BaseCellType = { type: CellType; uid: string };

type SavingsHeaderExtraData = { type: CellType.SAVINGS; address: string };
type UniswapPoolExtraData = { type: CellType.UNISWAP_POOL; address: string };
type CoinDividerExtraData = { type: CellType.COIN_DIVIDER; value: number };
type AssetsHeaderExtraData = { type: CellType.COIN_DIVIDER; value: number };
type CoinExtraData = { type: CellType.COIN; uniqueId: string };
type NFTExtraData = { type: CellType.NFT; uniqueId: string };

type CellExtraData =
  | { type: CellType.SAVINGS_HEADER }
  | { type: CellType.POOLS_HEADER }
  | { type: CellType.NFTS_HEADER }
  | { type: CellType.FAMILY_HEADER }
  | { type: CellType.LOADING_ASSETS }
  | SavingsHeaderExtraData
  | UniswapPoolExtraData
  | CoinDividerExtraData
  | CoinExtraData
  | NFTExtraData
  | AssetsHeaderExtraData

type CellTypes = BaseCellType & CellExtraData;

const { width } = Dimensions.get('window');

let containerCount = 0;

class CellContainer extends React.Component {
  constructor(args) {
    super(args);
    this._containerId = containerCount++;
  }
  render() {
    return (
      <View {...this.props}>
        {this.props.children}
        <Text>Cell Id: {this._containerId}</Text>
      </View>
    );
  }
}

function rowRenderer(type: CellType, data: CellTypes) {
  switch (type) {
    case CellType.COIN_DIVIDER:
      return <CoinDivider balancesSum={(data as CoinDividerExtraData).value} />;
    case CellType.ASSETS_HEADER:
      return <AssetListHeader totalValue={(data as AssetsHeaderExtraData).value} />;
    case CellType.COIN:
      return <WrapperBalanceCoinRow uniqueId={(data as CoinExtraData).uniqueId} item={{ uniqueId:(data as CoinExtraData).uniqueId  }}/>
  }
  return (
    <CellContainer style={styles.container}>
      <Text>Data: {JSON.stringify(data)}</Text>
    </CellContainer>
  );
}

const dataProvider = new DataProvider((r1, r2) => {
  return r1.uid !== r2.uid;
});

const getLayoutProvider = (briefSectionsData: CellTypes[]) =>
  new LayoutProvider(
    index => briefSectionsData[index].type,
    // @ts-ignore
    (type: CellType, dim) => {
      dim.width = width;
      if (ViewDimensions[type]) {
        dim.height = ViewDimensions[type].height;
        dim.width = ViewDimensions[type].width || dim.width;
        return;
      }
    }
  );

function useMemoBriefSectionData() {
  const { briefSectionsData } = useWalletSectionsData();
  return useDeepCompareMemo(() => briefSectionsData, [briefSectionsData]);
}

function RecyclerAssetList() {
  const briefSectionsData = useMemoBriefSectionData();
  const currentDataProvider = useMemo(
    () => dataProvider.cloneWithRows(briefSectionsData),
    [briefSectionsData]
  );

  const layoutProvider = useMemo(() => getLayoutProvider(briefSectionsData), [
    briefSectionsData,
  ]);

  return (
    <>
      <RecyclerListView
        dataProvider={currentDataProvider}
        layoutProvider={layoutProvider}
        rowRenderer={rowRenderer}
      />
    </>
  );
}

const styles = {
  container: {
    alignItems: 'center',
    backgroundColor: '#00a1f1',
    borderWidth: 2,
    flex: 1,
    justifyContent: 'space-around',
  },
  containerGridLeft: {
    alignItems: 'center',
    backgroundColor: '#ffbb00',
    flex: 1,
    justifyContent: 'space-around',
  },
  containerGridRight: {
    alignItems: 'center',
    backgroundColor: '#7cbb00',
    flex: 1,
    justifyContent: 'space-around',
  },
};

export default RecyclerAssetList;
