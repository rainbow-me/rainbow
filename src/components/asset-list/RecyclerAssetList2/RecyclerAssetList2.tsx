import equal from 'fast-deep-equal';
import { func } from 'prop-types';
import React, {
  Component,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import isEqual from 'react-fast-compare';
import {
  Dimensions,
  Animated as RNAnimated,
  ScrollView,
  ScrollViewProps,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
  RecyclerListViewProps,
} from 'recyclerlistview';
import BaseScrollView, {
  ScrollViewDefaultProps,
} from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import StickyContainer from 'recyclerlistview/sticky';

import { useDeepCompareMemo } from 'use-deep-compare';
import { useMemoOne } from 'use-memo-one';
import { CoinDivider, CoinDividerHeight } from '../../coin-divider';
import { BalanceCoinRow, CoinRowHeight } from '../../coin-row';
import SavingsListHeader from '../../savings/SavingsListHeader';
import { TokenFamilyHeader } from '../../token-family';
import { UniqueTokenRow } from '../../unique-token';
import { AssetListHeaderHeight } from '../AssetListHeader';
import { AssetListHeader } from '../index';
import { StickyHeaderContext, StickyHeaderManager } from './StickyHeaders';
import WrappedNFT from './WrappedNFT';
import WrappedPoolRow from './WrappedPoolRow';
import WrappedPoolsListHeader from './WrappedPoolsListHeader';
import WrappedSavingsListHeader from './WrappedSavingsListHeader';
import WrappedSavingsRow from './WrappedSavingsRow';
import WrappedTokenFamilyHeader from './WrappedTokenFamilyHeader';
import WrapperBalanceCoinRow from './WrapperBalanceCoinRow';
import { Text } from '@rainbow-me/design-system';
import assertNever from '@rainbow-me/helpers/assertNever';
import {
  useCoinListEdited,
  useOpenFamilies,
  useOpenInvestmentCards,
  useOpenSavings,
  useOpenSmallBalances,
  useWalletSectionsData,
} from '@rainbow-me/hooks';
import data from '@rainbow-me/redux/data';
import { deviceUtils } from '@rainbow-me/utils';

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
  [CellType.NFT]: {
    height: UniqueTokenRow.cardSize + UniqueTokenRow.cardMargin,
    width: deviceUtils.dimensions.width / 2 - 0.1,
  },
  [CellType.LOADING_ASSETS]: { height: AssetListHeaderHeight },
};

type BaseCellType = { type: CellType; uid: string; hidden?: boolean };

type SavingsHeaderExtraData = { type: CellType.SAVINGS_HEADER; value: string };
type SavingExtraData = { type: CellType.SAVINGS; address: string };
type UniswapPoolExtraData = { type: CellType.UNISWAP_POOL; address: string };
type CoinDividerExtraData = { type: CellType.COIN_DIVIDER; value: number };
type AssetsHeaderExtraData = { type: CellType.ASSETS_HEADER; value: number };
type PoolsHeaderExtraData = { type: CellType.POOLS_HEADER; value: number };
type CoinExtraData = { type: CellType.COIN; uniqueId: string };
type NFTExtraData = { type: CellType.NFT; uniqueId: string };
type NFTFamilyExtraData = {
  type: CellType.FAMILY_HEADER;
  name: string;
  total?: number;
  image?: string;
};

type CellExtraData =
  | { type: CellType.NFTS_HEADER }
  | { type: CellType.LOADING_ASSETS }
  | NFTFamilyExtraData
  | SavingExtraData
  | SavingsHeaderExtraData
  | UniswapPoolExtraData
  | CoinDividerExtraData
  | CoinExtraData
  | NFTExtraData
  | AssetsHeaderExtraData
  | PoolsHeaderExtraData;

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

const RecyclerAssetListContext = React.createContext<Record<string, object>>(
  {}
);

const RecyclerAssetListScrollPositionContext = React.createContext<
  RNAnimated.Value | undefined
>(undefined);

export function useAdditionalRecyclerAssetListData(uid: string) {
  const context = useContext(RecyclerAssetListContext)[uid];
  return useDeepCompareMemo(() => context, [context]);
}

export function useRecyclerAssetListPosition() {
  return useContext(RecyclerAssetListScrollPositionContext);
}

function CellDataProvider({
  uid,
  children,
}: {
  uid: string;
  children: (data: object) => React.ReactElement;
}) {
  const data = useAdditionalRecyclerAssetListData(uid);
  return children(data);
}

function rowRenderer(type: CellType, { uid }: { uid: string }) {
  return (
    <CellDataProvider uid={uid}>
      {data => {
        switch (type) {
          case CellType.COIN_DIVIDER:
            return (
              <CoinDivider balancesSum={(data as CoinDividerExtraData).value} />
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
          case CellType.FAMILY_HEADER:
            return <WrappedTokenFamilyHeader {...data} />;
          case CellType.NFT:
            return <WrappedNFT uniqueId={(data as NFTExtraData).uniqueId} />;
        }
        return (
          <CellContainer style={styles.container}>
            <Text>Data: {JSON.stringify(data)}</Text>
          </CellContainer>
        );
      }}
    </CellDataProvider>
  );
}

const dataProvider = new DataProvider((r1, r2) => {
  return r1.uid === r2.uid;
});

const getLayoutProvider = (briefSectionsData: BaseCellType[]) =>
  new LayoutProvider(
    index => briefSectionsData[index].type,
    // @ts-ignore
    (type: CellType, dim) => {
      dim.width = width;
      if (ViewDimensions[type]) {
        dim.height = ViewDimensions[type].height;
        dim.width = ViewDimensions[type].width || dim.width;
      }
    }
  );

function useMemoBriefSectionData() {
  const { briefSectionsData } = useWalletSectionsData();
  const { isSmallBalancesOpen } = useOpenSmallBalances();
  const { isSavingsOpen } = useOpenSavings();
  const { isInvestmentCardsOpen } = useOpenInvestmentCards();
  const { isCoinListEdited } = useCoinListEdited();
  const { openFamilies } = useOpenFamilies();

  const result = useDeepCompareMemo(() => {
    let afterDivider = false;
    let isGroupOpen = true;
    const stickyHeaders = [];
    let index = 0;
    const briefSectionsDataFiltered = briefSectionsData
      .filter(data => {
        if (
          data.type === CellType.ASSETS_HEADER ||
          data.type === CellType.NFTS_HEADER
        ) {
          stickyHeaders.push(index);
        }
        if (
          data.type === CellType.COIN &&
          !isSmallBalancesOpen &&
          afterDivider
        ) {
          return false;
        }
        if (data.type === CellType.COIN_DIVIDER) {
          afterDivider = true;
        }

        if (data.type === CellType.SAVINGS && !isSavingsOpen) {
          return false;
        }

        if (data.type === CellType.FAMILY_HEADER) {
          const name = (data as NFTFamilyExtraData).name;
          const showcase = name === 'Showcase';
          console.log(openFamilies, name)
          isGroupOpen = openFamilies[name + (showcase ? '-showcase' : '')];
        }

        if (data.type === CellType.NFT) {
          return isGroupOpen;
        }

        if (
          (data.type === CellType.POOLS_HEADER ||
            data.type === CellType.UNISWAP_POOL) &&
          isCoinListEdited
        ) {
          return false;
        }

        if (data.type === CellType.UNISWAP_POOL && !isInvestmentCardsOpen) {
          return false;
        }

        index++;
        return true;
      })
      .map(({ uid, type }) => ({ type, uid }));

    return briefSectionsDataFiltered;
  }, [
    briefSectionsData,
    isSmallBalancesOpen,
    isSavingsOpen,
    isInvestmentCardsOpen,
    isCoinListEdited,
    openFamilies,
  ]);
  const memoizedResult = useDeepCompareMemo(() => result, [result]);
  const additionalData = briefSectionsData.reduce((acc, data) => {
    acc[data.uid] = data;
    return acc;
  }, {});
  return { additionalData, memoizedResult };
}

const ExternalScrollViewWithRef = React.forwardRef(function ExternalScrollView(
  props: ScrollViewDefaultProps,
  ref
): BaseScrollView {
  const y = useRecyclerAssetListPosition()!;

  const { onScroll, ...rest } = props;
  const { scrollViewRef } = useContext(StickyHeaderContext)!;

  const event = useMemoOne(
    () =>
      RNAnimated.event(
        [
          {
            nativeEvent: {
              contentOffset: {
                y,
              },
            },
          },
        ],
        { listener: onScroll, useNativeDriver: true }
      ),
    [onScroll, y]
  );

  useImperativeHandle(ref, () => scrollViewRef.current);
  // @ts-ignore
  return (
    <RNAnimated.ScrollView
      {...(rest as ScrollViewProps)}
      onScroll={event}
      ref={scrollViewRef}
    />
  );
});

const RawMemoRecyclerAssetList = React.memo(function RawRecyclerAssetList({
  briefSectionsData,
}: {
  briefSectionsData: BaseCellType[];
}) {
  const currentDataProvider = useMemoOne(
    () => dataProvider.cloneWithRows(briefSectionsData),
    [briefSectionsData]
  );

  const layoutProvider = useMemoOne(
    () => getLayoutProvider(briefSectionsData),
    [briefSectionsData]
  );


  return (
    <RecyclerListView
      dataProvider={currentDataProvider}
      externalScrollView={ExternalScrollViewWithRef}
      layoutProvider={layoutProvider}
      renderAheadOffset={2000}
      // @ts-ignore
      rowRenderer={rowRenderer}
    />
  );
});

function RecyclerAssetList() {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData();

  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      <RecyclerAssetListContext.Provider value={additionalData}>
        <StickyHeaderManager>
          <RawMemoRecyclerAssetList briefSectionsData={briefSectionsData}/>
        </StickyHeaderManager>
      </RecyclerAssetListContext.Provider>
    </RecyclerAssetListScrollPositionContext.Provider>
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

export default React.memo(RecyclerAssetList);
