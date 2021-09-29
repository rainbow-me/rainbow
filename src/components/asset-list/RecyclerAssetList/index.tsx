import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import { findIndex, get } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import isEqual from 'react-fast-compare';
import {
  LayoutChangeEvent,
  PixelRatio,
  RefreshControl,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import {
  RecyclerListViewProps,
  RecyclerListViewState,
} from 'recyclerlistview/dist/reactnative/core/RecyclerListView';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components';
import { withThemeContext } from '../../../context/ThemeContext';
import { CoinDivider } from '../../coin-divider';
import { CoinRowHeight } from '../../coin-row';
import AssetListHeader, { AssetListHeaderHeight } from '../AssetListHeader';
import { firstCoinRowMarginTop, ViewTypes } from '../RecyclerViewTypes';

import LayoutItemAnimator from './LayoutItemAnimator';
import { EthereumAddress } from '@rainbow-me/entities';
import { usePrevious } from '@rainbow-me/hooks';
import { deviceUtils, logger } from '@rainbow-me/utils';

const extractCollectiblesIdFromRow = (row: {
  item: {
    tokens: { asset_contract: { address: EthereumAddress }; id: string }[][];
  };
}) => {
  try {
    let tokenAddresses = '';
    row.item?.tokens?.forEach(
      (
        token: { asset_contract: { address: EthereumAddress }; id: string }[]
      ) => {
        token.forEach(
          (individualToken: {
            asset_contract: { address: EthereumAddress };
            id: string;
          }) => {
            tokenAddresses += `${individualToken?.asset_contract?.address}|${individualToken?.id}||`;
          }
        );
      }
    );
    return tokenAddresses;
    // eslint-disable-next-line no-empty
  } catch (e) {}
};

const extractRelevantAssetInfo = (asset: {
  address: EthereumAddress;
  balance: { display: string };
  price: { relative_change_24h: string };
  native: { balance: { display: string } };
}) => {
  try {
    const {
      address,
      balance: { display: balanceDisplay },
      price: { relative_change_24h: relativeChange24h },
      native: {
        balance: { display: nativeBalanceDisplay },
      },
    } = asset;
    return {
      address,
      balanceDisplay,
      nativeBalanceDisplay,
      relativeChange24h,
    };
    // eslint-disable-next-line no-empty
  } catch (e) {}
};

const extractPoolRelevantAssetsInfo = (data: any[]) => {
  try {
    return data?.map(asset => ({
      address: asset.address,
      balanceDisplay: asset.balance?.display,
      nativeBalanceDisplay: asset.native?.balance?.display,
      priceDisplay: asset.price?.value,
      relativeChange24h: asset.price?.relative_change_24h,
      totalNativeDisplay: asset.totalNativeDisplay,
    }));
    // eslint-disable-next-line no-empty
  } catch (e) {}
};

const defaultIndices = [0];
const isEqualDataProvider = new DataProvider((r1, r2) => {
  // Last placeholder
  if (r1.isLastPlaceholder) {
    return r1.isLastPlaceholder === r2.isLastPlaceholder;
    // coinDivider
  } else if (r1.item?.coinDivider) {
    return r1.item?.value === r2.item?.value;
    // Savings
  } else if (r1.item?.savingsContainer) {
    return isEqual(r1.item.assets, r2.item?.assets);
    // Family sections
  } else if (r1.familySectionIndex === 0 || r1.familySectionIndex > 0) {
    const nftsRow1 = extractCollectiblesIdFromRow(r1);
    const nftsRow2 = extractCollectiblesIdFromRow(r2);
    return (
      r1.item.childrenAmount === r2.item?.childrenAmount &&
      r1.item.familyName === r2.item?.familyName &&
      isEqual(nftsRow1, nftsRow2)
    );

    // Coin Rows
  } else if (r1.item?.address) {
    const slimR1 = extractRelevantAssetInfo(r1.item);
    const slimR2 = extractRelevantAssetInfo(r2.item);
    return isEqual(slimR1, slimR2);
    // Pool rows
  } else if (r1.data) {
    const r1Assets = r1.data.map(extractPoolRelevantAssetsInfo);
    const r2Assets = r2.data?.map(extractPoolRelevantAssetsInfo);
    return isEqual(r1Assets, r2Assets);
    // Small balances rows
  } else if (r1.item?.assets) {
    const r1Assets = r1.item.assets.map(extractRelevantAssetInfo);
    const r2Assets = r2.item?.assets?.map(extractRelevantAssetInfo);
    return isEqual(r1Assets, r2Assets);
    // Headers, which are very small objects :D
  } else {
    return isEqual(r1, r2);
  }
});

const StyledRecyclerListView = styled(RecyclerListView)`
  background-color: ${({ theme: { colors } }) => colors.white};
  display: flex;
  flex: 1;
  min-height: 1;
`;

const StyledContainer = styled(View)`
  display: flex;
  flex: 1;
  background-color: ${({ theme: { colors } }) => colors.white};
  overflow: hidden;
`;

type RecyclerListViewRef = RecyclerListView<
  RecyclerListViewProps,
  RecyclerListViewState
>;

function useRecyclerListViewRef(): {
  readonly handleRef: (ref: RecyclerListViewRef) => void;
  readonly ref: RecyclerListViewRef | undefined;
} {
  const ref = useRef<RecyclerListViewRef>();
  const handleRef = React.useCallback(
    (nextRef: RecyclerListViewRef): void => {
      ref.current = nextRef;
      return;
    },
    [ref]
  );

  return { handleRef, ref: ref.current };
}

export type RecyclerAssetListSection = {
  readonly name: string;
  readonly balances: boolean;
  readonly data: any[];
  readonly collectibles: {
    readonly data: readonly any[];
  };
  readonly header: {
    readonly title: string;
    readonly totalItems: number;
    readonly totalValue: string;
  };
  readonly perData: any;
  readonly pools: boolean;
  readonly renderItem: (item: any) => JSX.Element | null;
  readonly type: string;
};

// TODO: This should be global.
export type RecyclerAssetListReduxProps = {
  readonly editOptions: {
    readonly isCoinListEdited: boolean;
  };
  readonly openSavings: boolean;
  readonly openSmallBalances: boolean;
  readonly openStateSettings: {
    readonly openFamilyTabs: {
      readonly [key: string]: boolean;
    };
    readonly openInvestmentCards: {
      readonly [key: string]: boolean;
    };
    readonly openSavings: {
      readonly [key: string]: boolean;
    };
    readonly openSmallBalances: {
      readonly [key: string]: boolean;
    };
  };
};

const NoStickyContainer = ({
  children,
}: {
  children: JSX.Element;
}): JSX.Element => children;

export type RecyclerAssetListProps = {
  readonly isCoinListEdited: boolean;
  readonly fetchData: () => Promise<unknown>;
  readonly setIsBlockingUpdate: (isBlockingUpdate: boolean) => void;
  // TODO: This needs to be migrated into a global type.
  readonly colors: {
    readonly alpha: (color: string, alpha: number) => string;
    readonly blueGreyDark: string;
  };
  readonly sections: readonly RecyclerAssetListSection[];
  readonly paddingBottom?: number;
  readonly isBlockingUpdate: boolean;
  readonly hideHeader: boolean;
  readonly renderAheadOffset?: number;
  readonly openInvestmentCards: boolean;
  readonly openFamilyTabs: {
    readonly [key: string]: boolean;
  };
  readonly openSavings: boolean;
  readonly openFamilies?: boolean;
  readonly showcase?: boolean;
  readonly disableStickyHeaders?: boolean;
  readonly disableAutoScrolling?: boolean;
  readonly disableRefreshControl?: boolean;
  readonly openSmallBalances: boolean;
};

function RecyclerAssetList({
  isCoinListEdited,
  fetchData,
  colors,
  sections,
  openInvestmentCards,
  openFamilyTabs,
  openSavings,
  openSmallBalances,
  paddingBottom = 0,
  hideHeader,
  renderAheadOffset = deviceUtils.dimensions.height,
  setIsBlockingUpdate,
  showcase,
  disableStickyHeaders,
  disableAutoScrolling,
  disableRefreshControl,
  ...extras
}: RecyclerAssetListProps): JSX.Element {
  const { ref, handleRef } = useRecyclerListViewRef();
  const stickyCoinDividerRef = React.useRef<View>() as React.RefObject<View>;
  const [globalDeviceDimensions, setGlobalDeviceDimensions] = useState<number>(
    0
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const {
    areSmallCollectibles,
    items,
    itemsCount,
    sectionsIndices,
    stickyComponentsIndices,
  } = useMemo(() => {
    const sectionsIndices: number[] = [];
    const stickyComponentsIndices: number[] = [];
    const items = sections.reduce((ctx: any[], section) => {
      sectionsIndices.push(ctx.length);
      if (section.pools) {
        ctx = ctx.concat([
          {
            data: section.data,
            pools: true,
            ...section.header,
          },
        ]);
      } else {
        stickyComponentsIndices.push(ctx.length);
        ctx = ctx.concat([
          {
            isHeader: true,
            ...section.header,
          },
        ]);
        if (section.collectibles) {
          section.data.forEach((item, index) => {
            if (
              item.isHeader ||
              openFamilyTabs[item.familyName + (showcase ? '-showcase' : '')]
            ) {
              ctx.push({
                familySectionIndex: index,
                item: { ...item, ...section.perData },
                renderItem: section.renderItem,
              });
            }
          });
        } else {
          ctx = ctx.concat(
            section.data.map(item => ({
              item: { ...item, ...section.perData },
              renderItem: section.renderItem,
            }))
          );
        }
      }
      return ctx;
    }, []);
    items.push({ item: { isLastPlaceholder: true }, renderItem: () => null });
    const areSmallCollectibles = (c => c && get(c, 'type') === 'small')(
      sections.find(e => e.collectibles)
    );
    return {
      areSmallCollectibles,
      items,
      itemsCount: items.length,
      sectionsIndices,
      stickyComponentsIndices,
    };
  }, [openFamilyTabs, sections, showcase]);

  // Defines the position of the coinDivider, if it exists.
  const coinDividerIndex = useMemo<number>(() => {
    const hasCoinDivider = items.some(({ item }) => item?.coinDivider);
    if (hasCoinDivider) {
      return findIndex(items, ({ item }) => item?.coinDivider);
    }
    return -1;
  }, [items]);

  // HACK: Force synchronization of the StickyHeader on iOS when mounted.
  React.useEffect(() => {
    !!ref &&
      ios &&
      requestAnimationFrame(() => {
        ref.scrollToOffset(0, 1 / PixelRatio.get(), false);
      });
  }, [ref]);
  const checkEditStickyHeader = useCallback(
    (offsetY: number) => {
      const offsetHeight =
        CoinRowHeight * (coinDividerIndex - 1) + firstCoinRowMarginTop;
      const shouldRenderSticky = isCoinListEdited && offsetY > offsetHeight;
      stickyCoinDividerRef.current?.setNativeProps({
        pointerEvents: shouldRenderSticky ? 'box-none' : 'none',
        style: {
          opacity: shouldRenderSticky ? 1 : 0,
        },
      });
      return;
    },
    [stickyCoinDividerRef, coinDividerIndex, isCoinListEdited]
  );
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !fetchData) {
      return;
    }
    try {
      setIsRefreshing(true);
      setIsBlockingUpdate(true);
      await fetchData();
    } catch (e) {
      logger.error(e);
    } finally {
      setTimeout(() => setIsBlockingUpdate(false), 200);
      setIsRefreshing(false);
    }
  }, [isRefreshing, fetchData, setIsBlockingUpdate]);
  const onLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      // set globalDeviceDimensions
      // used in LayoutItemAnimator and auto-scroll logic above 👇
      const topMargin = nativeEvent.layout.y;
      const additionalPadding = 10;
      setGlobalDeviceDimensions(
        deviceUtils.dimensions.height -
          topMargin -
          AssetListHeaderHeight -
          additionalPadding
      );
    },
    [setGlobalDeviceDimensions]
  );

  const stickyRowRenderer = React.useCallback(
    // TODO: What does the data look like?
    (_type: string | number | undefined, data: any) => {
      return <AssetListHeader {...data} isSticky />;
    },
    []
  );

  const onScroll = useCallback(
    (e: unknown, f: unknown, offsetY: number) => {
      isCoinListEdited && checkEditStickyHeader(offsetY);
    },
    [checkEditStickyHeader, isCoinListEdited]
  );

  const rowRenderer = React.useCallback(
    (type: any, data: any, index: number): JSX.Element | null => {
      // Checks if value is *nullish*.
      if (data == null || index == null) {
        return null;
      }

      if (type.index === ViewTypes.HEADER.index) {
        return (showcase
          ? ViewTypes.SHOWCASE_HEADER
          : ViewTypes.HEADER
        ).renderComponent({
          data,
          isCoinListEdited,
        });
      } else if (type.index === ViewTypes.COIN_ROW.index) {
        return ViewTypes.COIN_ROW.renderComponent({
          data,
          type,
        });
      } else if (type.index === ViewTypes.COIN_DIVIDER.index) {
        return ViewTypes.COIN_DIVIDER.renderComponent({
          data,
        });
      } else if (type.index === ViewTypes.COIN_SMALL_BALANCES.index) {
        return ViewTypes.COIN_SMALL_BALANCES.renderComponent({
          data,
        });
      } else if (type.index === ViewTypes.COIN_SAVINGS.index) {
        return ViewTypes.COIN_SAVINGS.renderComponent({
          data,
        });
      } else if (type.index === ViewTypes.POOLS.index) {
        return ViewTypes.POOLS.renderComponent({ data, isCoinListEdited });
      } else if (type.index === ViewTypes.UNIQUE_TOKEN_ROW.index) {
        return ViewTypes.UNIQUE_TOKEN_ROW.renderComponent({
          data,
          index,
          sections,
          type,
        });
      }
      return null;
    },
    [isCoinListEdited, sections, showcase]
  );

  const animator = useMemo(
    () => new LayoutItemAnimator(paddingBottom, globalDeviceDimensions, ref),
    [globalDeviceDimensions, paddingBottom, ref]
  );

  const layoutProvider = useMemo(() => {
    return new LayoutProvider(
      // The LayoutProvider expects us to return ReactText, however internally
      // we use custom layout description objects, so we can ignore this error.
      // @ts-ignore
      (index: number) => {
        // Main list logic 👇
        // Every component to render properly should return object
        // containing at least height and index

        // Height should be calculated via calculateHeight func from ViewTypes object

        // Index is type index not some single row index so should describe one kind of object

        const balancesIndex = findIndex(
          sections,
          ({ name }) => name === 'balances'
        );
        const collectiblesIndex = findIndex(
          sections,
          ({ name }) => name === 'collectibles'
        );
        const poolsIndex = findIndex(sections, ({ name }) => name === 'pools');

        if (sectionsIndices.includes(index)) {
          if (index === sectionsIndices[poolsIndex]) {
            return {
              height: ViewTypes.POOLS.calculateHeight({
                amountOfRows: sections[poolsIndex].data.length,
                isLast: true,
                isOpen: openInvestmentCards,
              }),
              index: ViewTypes.POOLS.index,
              visibleDuringCoinEdit: ViewTypes.POOLS.visibleDuringCoinEdit,
            };
          }
          return {
            height: (showcase
              ? ViewTypes.SHOWCASE_HEADER
              : ViewTypes.HEADER
            ).calculateHeight({
              hideHeader,
            }),
            index: ViewTypes.HEADER.index,
            visibleDuringCoinEdit: ViewTypes.HEADER.visibleDuringCoinEdit,
          };
        }

        if (index === itemsCount - 1) {
          return {
            height: ViewTypes.FOOTER.calculateHeight({
              paddingBottom,
            }),
            index: ViewTypes.FOOTER.index,
          };
        }

        if (
          balancesIndex > -1 &&
          (index <= sectionsIndices[collectiblesIndex] ||
            collectiblesIndex < 0) &&
          (index <= sectionsIndices[poolsIndex] || poolsIndex < 0)
        ) {
          const balanceItemsCount = get(
            sections,
            `[${balancesIndex}].data.length`,
            0
          );
          const lastBalanceIndex =
            sectionsIndices[balancesIndex] + balanceItemsCount;
          if (index === lastBalanceIndex - 2) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 2]
                .smallBalancesContainer
            ) {
              return {
                height: ViewTypes.COIN_DIVIDER.calculateHeight(),
                index: ViewTypes.COIN_DIVIDER.index,
                visibleDuringCoinEdit:
                  ViewTypes.COIN_DIVIDER.visibleDuringCoinEdit,
              };
            }
          }
          if (index === lastBalanceIndex - 1) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 2] &&
              sections[balancesIndex].data[lastBalanceIndex - 2]
                .smallBalancesContainer
            ) {
              const smallBalancesIndex = index - 1;
              return {
                height: ViewTypes.COIN_SMALL_BALANCES.calculateHeight({
                  isCoinListEdited: isCoinListEdited,
                  isOpen: openSmallBalances,
                  smallBalancesLength:
                    sections[balancesIndex].data[smallBalancesIndex].assets
                      .length,
                }),
                index: ViewTypes.COIN_SMALL_BALANCES.index,
                visibleDuringCoinEdit:
                  ViewTypes.COIN_SMALL_BALANCES.visibleDuringCoinEdit,
              };
            }
          }
          if (index === lastBalanceIndex) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 1]
                .savingsContainer
            ) {
              return {
                height: ViewTypes.COIN_SAVINGS.calculateHeight({
                  amountOfRows:
                    sections[balancesIndex].data[index - 1].assets?.length || 0,
                  isLast: poolsIndex < 0,
                  isOpen: openSavings,
                }),
                index: ViewTypes.COIN_SAVINGS.index,
              };
            }
          }
          const firstBalanceIndex = sectionsIndices[balancesIndex] + 1;
          const isFirst =
            index === firstBalanceIndex &&
            !sections[balancesIndex].data[firstBalanceIndex - 1]
              .smallBalancesContainer;

          return {
            height: ViewTypes.COIN_ROW.calculateHeight({
              areSmallCollectibles,
              isFirst,
              isLast: index === lastBalanceIndex,
            }),
            index: ViewTypes.COIN_ROW.index,
            isFirst,
            visibleDuringCoinEdit: ViewTypes.COIN_ROW.visibleDuringCoinEdit,
          };
        }

        if (collectiblesIndex > -1) {
          if (index > sectionsIndices[collectiblesIndex]) {
            const familyIndex = items[index].familySectionIndex;
            const isFirst = index === sectionsIndices[collectiblesIndex] + 1;
            const isHeader =
              sections[collectiblesIndex].data[familyIndex].isHeader;
            return {
              height: ViewTypes.UNIQUE_TOKEN_ROW.calculateHeight({
                amountOfRows: get(
                  sections,
                  `[${collectiblesIndex}].data[${familyIndex}].tokens`,
                  []
                ).length,
                isFirst,
                isHeader,
                isOpen:
                  openFamilyTabs[
                    sections[collectiblesIndex].data[familyIndex].familyName +
                      (showcase ? '-showcase' : '')
                  ],
              }),
              index: ViewTypes.UNIQUE_TOKEN_ROW.index,
              isFirst,
              isHeader,
            };
          }
        }

        return {
          height: ViewTypes.UNKNOWN.calculateHeight(),
          index: ViewTypes.UNKNOWN.index,
        };
      },
      (type, dim) => {
        const element = (type as unknown) as {
          readonly height: number;
          readonly visibleDuringCoinEdit: boolean;
        };
        const { visibleDuringCoinEdit, height } = element;
        // Set height of element using object created above 👇
        dim.width = deviceUtils.dimensions.width;
        dim.height = isCoinListEdited && !visibleDuringCoinEdit ? 0 : height;
      }
    );
  }, [
    areSmallCollectibles,
    hideHeader,
    isCoinListEdited,
    items,
    itemsCount,
    openFamilyTabs,
    openInvestmentCards,
    openSavings,
    openSmallBalances,
    paddingBottom,
    sections,
    sectionsIndices,
    showcase,
  ]);

  const scrollViewProps = useMemo(
    (): Partial<ScrollViewProps> =>
      disableRefreshControl
        ? {}
        : {
            refreshControl: (
              <RefreshControl
                onRefresh={handleRefresh}
                progressViewOffset={android ? 30 : 0}
                refreshing={isRefreshing}
                tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
              />
            ),
          },
    [disableRefreshControl, handleRefresh, isRefreshing, colors]
  );

  const extendedState = useMemo(() => ({ sectionsIndices }), [sectionsIndices]);

  const dataProvider = useMemo(() => {
    return isEqualDataProvider.cloneWithRows(items);
  }, [items]);

  const scrollToOffset = useCallback(
    (offsetY: number, animated: boolean = false) =>
      requestAnimationFrame(
        () => !disableAutoScrolling && ref?.scrollToOffset(0, offsetY, animated)
      ),
    [disableAutoScrolling, ref]
  );

  const lastSections = usePrevious(sections) || sections;
  const lastOpenFamilyTabs = usePrevious(openFamilyTabs) || openFamilyTabs;
  const lastIsCoinListEdited =
    usePrevious(isCoinListEdited) || isCoinListEdited;

  useEffect(() => {
    lastIsCoinListEdited !== isCoinListEdited && checkEditStickyHeader(0);
  }, [lastIsCoinListEdited, isCoinListEdited, checkEditStickyHeader]);

  useEffect(() => {
    let collectibles: RecyclerAssetListSection = {} as RecyclerAssetListSection;
    let prevCollectibles: RecyclerAssetListSection = {} as RecyclerAssetListSection;

    sections.forEach(section => {
      if (section.collectibles) {
        collectibles = section;
      }
    });

    lastSections.forEach(section => {
      if (section.collectibles) {
        prevCollectibles = section;
      }
    });

    const bottomHorizonOfScreen =
      (ref?.getCurrentScrollOffset() || 0) + globalDeviceDimensions;

    // Auto-scroll to opened family logic 👇
    if (openFamilyTabs !== lastOpenFamilyTabs && collectibles.data) {
      let i = 0;
      while (i < collectibles.data.length) {
        if (
          openFamilyTabs[
            collectibles.data[i].familyName + (showcase ? '-showcase' : '')
          ] === true &&
          !lastOpenFamilyTabs[
            collectibles.data[i].familyName + (showcase ? '-showcase' : '')
          ]
        ) {
          const safeIndex = i;
          const safeCollectibles = collectibles;
          const familyIndex = findIndex(
            dataProvider.getAllData(),
            function (data) {
              return (
                data.item?.familyName ===
                safeCollectibles.data[safeIndex].familyName
              );
            }
          );

          const focusedFamilyItem = dataProvider.getAllData()[familyIndex].item;
          const focusedFamilyHeight = ViewTypes.UNIQUE_TOKEN_ROW.calculateHeight(
            {
              amountOfRows: Math.ceil(
                Number(focusedFamilyItem.childrenAmount) / 2
              ),
              isFirst: false,
              isHeader: true,
              isOpen: true,
            }
          );

          const layout = ref?.getLayout(familyIndex);
          if (layout) {
            const startOfDesiredComponent = layout.y - AssetListHeaderHeight;
            if (focusedFamilyHeight < globalDeviceDimensions) {
              const endOfDesiredComponent =
                startOfDesiredComponent +
                focusedFamilyHeight +
                AssetListHeaderHeight;
              if (endOfDesiredComponent > bottomHorizonOfScreen) {
                scrollToOffset(
                  endOfDesiredComponent - globalDeviceDimensions,
                  true
                );
              }
            } else {
              scrollToOffset(startOfDesiredComponent, true);
            }
          }
          break;
        }
        i++;
      }
    }

    // Auto-scroll to end of the list if something was closed/disappeared 👇
    if (
      ref &&
      ref.getContentDimension().height <
        bottomHorizonOfScreen +
          ViewTypes.FOOTER.calculateHeight({
            paddingBottom: paddingBottom || 0,
          }) &&
      ref.getCurrentScrollOffset() > 0 &&
      (!isCoinListEdited || (!lastIsCoinListEdited && isCoinListEdited))
    ) {
      requestAnimationFrame(() => ref?.scrollToEnd(true));
    }

    // Auto-scroll to showcase family if something was added/removed 👇
    if (
      collectibles.data &&
      prevCollectibles.data &&
      collectibles.data[0]?.familyName === 'Showcase' &&
      (collectibles.data[0]?.childrenAmount !==
        prevCollectibles.data[0]?.childrenAmount ||
        prevCollectibles.data[0]?.familyName !== 'Showcase')
    ) {
      const familyIndex = findIndex(dataProvider.getAllData(), function (data) {
        return data.item?.familyName === 'Showcase';
      });

      const layout = ref?.getLayout(familyIndex);
      if (layout) {
        const { y: startOfDesiredComponent } = layout;
        scrollToOffset(startOfDesiredComponent - AssetListHeaderHeight, true);
      }
    }
  }, [
    ref,
    globalDeviceDimensions,
    dataProvider,
    lastIsCoinListEdited,
    lastOpenFamilyTabs,
    lastSections,
    sections,
    isCoinListEdited,
    openFamilyTabs,
    paddingBottom,
    scrollToOffset,
    showcase,
  ]);

  const MaybeStickyContainer = disableStickyHeaders
    ? NoStickyContainer
    : StickyContainer;

  const isInsideBottomSheet = !!useContext(BottomSheetContext);

  return (
    <StyledContainer onLayout={onLayout}>
      {/* @ts-ignore */}
      <MaybeStickyContainer
        overrideRowRenderer={stickyRowRenderer}
        stickyHeaderIndices={
          disableStickyHeaders
            ? []
            : isCoinListEdited
            ? defaultIndices
            : stickyComponentsIndices
        }
      >
        {/* @ts-ignore */}
        <StyledRecyclerListView
          dataProvider={dataProvider}
          extendedState={extendedState}
          {...(isInsideBottomSheet && {
            externalScrollView: BottomSheetScrollView,
          })}
          itemAnimator={animator}
          layoutProvider={layoutProvider}
          onScroll={onScroll}
          ref={handleRef}
          renderAheadOffset={renderAheadOffset}
          rowRenderer={rowRenderer}
          scrollViewProps={scrollViewProps}
          {...extras}
        />
      </MaybeStickyContainer>
      <View
        pointerEvents="none"
        ref={stickyCoinDividerRef}
        style={[
          StyleSheet.absoluteFill,
          {
            marginTop: AssetListHeaderHeight,
            opacity: 0,
          },
        ]}
      >
        <CoinDivider balancesSum={0} isSticky onEndEdit={() => null} />
      </View>
    </StyledContainer>
  );
}

export default connect(
  ({
    editOptions: { isCoinListEdited },
    openStateSettings: {
      openFamilyTabs,
      openInvestmentCards,
      openSavings,
      openSmallBalances,
    },
  }: RecyclerAssetListReduxProps) => ({
    isCoinListEdited,
    openFamilyTabs,
    openInvestmentCards,
    openSavings,
    openSmallBalances,
  })
)(
  withThemeContext(
    React.memo(RecyclerAssetList, (_, curr) => curr.isBlockingUpdate)
  )
);
