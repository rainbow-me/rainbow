import { findIndex, get, isNil } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  RefreshControl,
  UIManager,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';

import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components';
import { withThemeContext } from '../../../context/ThemeContext';
import { CoinDivider } from '../../coin-divider';
import { CoinRowHeight } from '../../coin-row';
import AssetListHeader, { AssetListHeaderHeight } from '../AssetListHeader';
import { firstCoinRowMarginTop, ViewTypes } from '../RecyclerViewTypes';

import LayoutItemAnimator from './LayoutItemAnimator';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';
import hasRowChanged from './hasRowChanged';
import { usePrevious } from '@rainbow-me/hooks';
import { deviceUtils, logger } from '@rainbow-me/utils';

android && UIManager.setLayoutAnimationEnabledExperimental?.(true);

const defaultIndices = [0];

const StyledRecyclerListView = styled(RecyclerListView)`
  background-color: ${({ theme: { colors } }) => colors.white};
  display: flex;
  flex: 1;
  min-height: 1;
`;

const StyledContainer = styled(View)`
  display: flex;
  flex: 1;
  background-color: ${({ theme: { colors } }) => colors.black};
  overflow: hidden;
`;

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
  };
  readonly settings: {
    readonly nativeCurrency: string;
  };
};

export type RecyclerAssetListProps = {
  readonly isCoinListEdited: boolean;
  readonly fetchData: () => Promise<unknown>;
  // TODO: This needs to be migrated into a global type.
  readonly colors: {
    readonly alpha: (color: string, alpha: number) => string;
    readonly blueGreyDark: string;
  };
  readonly nativeCurrency: string;
  readonly sections: readonly RecyclerAssetListSection[];
  readonly paddingBottom?: number;
  readonly hideHeader: boolean;
  readonly renderAheadOffset?: number;
  readonly openInvestmentCards: boolean;
  readonly openFamilyTabs: {
    readonly [key: string]: boolean;
  };
  readonly openSavings: boolean;
  readonly openSmallBalances: boolean;
};

function RecyclerAssetList({
  isCoinListEdited,
  fetchData,
  colors,
  nativeCurrency,
  sections,
  openInvestmentCards,
  openFamilyTabs,
  openSavings,
  openSmallBalances,
  paddingBottom = 0,
  hideHeader,
  renderAheadOffset = deviceUtils.dimensions.height,
  ...extras
}: RecyclerAssetListProps): JSX.Element {
  const [globalDeviceDimensions, setGlobalDeviceDimensions] = useState<number>(
    0
  );
  const [coinDividerIndex, setCoinDividerIndex] = useState<number>(-1);
  const [showCoinListEditor, setShowCoinListEditor] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const checkEditStickyHeader = useCallback(
    (offsetY: number) => {
      const offsetHeight =
        CoinRowHeight * (coinDividerIndex - 1) + firstCoinRowMarginTop;
      if (isCoinListEdited && offsetY > offsetHeight) {
        setShowCoinListEditor(true);
      } else if (
        !!showCoinListEditor &&
        (offsetY < offsetHeight || !isCoinListEdited)
      ) {
        setShowCoinListEditor(false);
      }
    },
    [
      isCoinListEdited,
      setShowCoinListEditor,
      showCoinListEditor,
      coinDividerIndex,
    ]
  );
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !fetchData) {
      return;
    }
    try {
      setIsRefreshing(true);
      await fetchData();
    } catch (e) {
      logger.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, setIsRefreshing, fetchData]);
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
    (_type: string | number | undefined, data: any) => (
      <>
        <AssetListHeader {...data} isSticky />
        {showCoinListEditor ? (
          <CoinDivider
            balancesSum={0}
            isSticky
            nativeCurrency={nativeCurrency}
            onEndEdit={() => setShowCoinListEditor(false)}
          />
        ) : null}
      </>
    ),
    [showCoinListEditor, setShowCoinListEditor, nativeCurrency]
  );

  const onScroll = useCallback(
    (e: unknown, f: unknown, offsetY: number) => {
      isCoinListEdited && checkEditStickyHeader(offsetY);
    },
    [isCoinListEdited, checkEditStickyHeader]
  );

  const rowRenderer = React.useCallback(
    (type: any, data: any, index: number): JSX.Element | null => {
      if (isNil(data) || isNil(index)) {
        return null;
      }
      if (isCoinListEdited && !(type.index < 4)) {
        return null;
      }

      if (type.index === ViewTypes.HEADER.index) {
        return ViewTypes.HEADER.renderComponent({
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
          isCoinListEdited,
          nativeCurrency,
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
    [isCoinListEdited, nativeCurrency, sections]
  );

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
            if (item.isHeader || openFamilyTabs[item.familyName]) {
              ctx.push({
                familySectionIndex: index,
                item: { ...item, ...section.perData },
                renderItem: section.renderItem, // 8% of CPU
              });
            }
          });
        } else {
          ctx = ctx.concat(
            section.data.map(item => ({
              item: { ...item, ...section.perData },
              renderItem: section.renderItem, // 1% of CPU
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
  }, [openFamilyTabs, sections]);

  const animator = useMemo(
    () => new LayoutItemAnimator(paddingBottom, globalDeviceDimensions),
    [globalDeviceDimensions, paddingBottom]
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
            height: ViewTypes.HEADER.calculateHeight({
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
            if (coinDividerIndex !== index) {
              setCoinDividerIndex(index);
              if (isCoinListEdited) {
                RecyclerAssetListSharedState.rlv &&
                  checkEditStickyHeader(
                    RecyclerAssetListSharedState.rlv.getCurrentScrollOffset()
                  );
              }
            }
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
                    sections[collectiblesIndex].data[familyIndex].familyName
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
    coinDividerIndex,
    setCoinDividerIndex,
    areSmallCollectibles,
    checkEditStickyHeader,
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
  ]);

  const scrollViewProps = useMemo(
    () => ({
      refreshControl: (
        <RefreshControl
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          style={ios ? {} : { top: 20 }}
          tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
        />
      ),
    }),
    [handleRefresh, isRefreshing, colors]
  );

  const extendedState = useMemo(() => ({ sectionsIndices }), [sectionsIndices]);

  const dataProvider = useMemo(() => {
    return new DataProvider(hasRowChanged).cloneWithRows(items);
  }, [items]);

  const scrollToOffset = useCallback(
    (offsetY: number, animated: boolean = false) =>
      requestAnimationFrame(() =>
        RecyclerAssetListSharedState.rlv?.scrollToOffset(0, offsetY, animated)
      ),
    []
  );
  useEffect(() => {
    requestAnimationFrame(() =>
      RecyclerAssetListSharedState.rlv?.scrollToTop(false)
    );
  }, [nativeCurrency]);

  const lastSections = usePrevious(sections) || sections;
  const lastOpenFamilyTabs = usePrevious(openFamilyTabs) || openFamilyTabs;
  const lastIsCoinListEdited =
    usePrevious(isCoinListEdited) || isCoinListEdited;

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
      (RecyclerAssetListSharedState.rlv?.getCurrentScrollOffset() || 0) +
      globalDeviceDimensions;

    // Auto-scroll to opened family logic 👇
    if (openFamilyTabs !== lastOpenFamilyTabs && collectibles.data) {
      let i = 0;
      while (i < collectibles.data.length) {
        if (
          openFamilyTabs[collectibles.data[i].familyName] === true &&
          !lastOpenFamilyTabs[collectibles.data[i].familyName]
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

          const layout = RecyclerAssetListSharedState.rlv?.getLayout(
            familyIndex
          );
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
      RecyclerAssetListSharedState.rlv &&
      RecyclerAssetListSharedState.rlv.getContentDimension().height <
        bottomHorizonOfScreen +
          ViewTypes.FOOTER.calculateHeight({
            paddingBottom: paddingBottom || 0,
          }) &&
      RecyclerAssetListSharedState.rlv.getCurrentScrollOffset() > 0 &&
      (!isCoinListEdited || (!lastIsCoinListEdited && isCoinListEdited))
    ) {
      requestAnimationFrame(() =>
        RecyclerAssetListSharedState.rlv?.scrollToEnd(true)
      );
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

      const layout = RecyclerAssetListSharedState.rlv?.getLayout(familyIndex);
      if (layout) {
        const { y: startOfDesiredComponent } = layout;
        scrollToOffset(startOfDesiredComponent - AssetListHeaderHeight, true);
      }
    }
  }, [
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
  ]);

  const handleListRef = useCallback(ref => {
    RecyclerAssetListSharedState.rlv = ref;
  }, []);

  return (
    <StyledContainer onLayout={onLayout}>
      <StickyContainer
        overrideRowRenderer={stickyRowRenderer}
        stickyHeaderIndices={
          isCoinListEdited ? defaultIndices : stickyComponentsIndices
        }
      >
        {/* @ts-ignore */}
        <StyledRecyclerListView
          dataProvider={dataProvider}
          extendedState={extendedState}
          itemAnimator={animator}
          layoutProvider={layoutProvider}
          onScroll={onScroll}
          ref={handleListRef}
          renderAheadOffset={renderAheadOffset}
          rowRenderer={rowRenderer}
          scrollViewProps={scrollViewProps}
          {...extras}
        />
      </StickyContainer>
    </StyledContainer>
  );
}

export default connect(
  ({
    editOptions: { isCoinListEdited },
    openSavings,
    openSmallBalances,
    openStateSettings: { openFamilyTabs, openInvestmentCards },
    settings: { nativeCurrency },
  }: RecyclerAssetListReduxProps) => ({
    isCoinListEdited,
    nativeCurrency,
    openFamilyTabs,
    openInvestmentCards,
    openSavings,
    openSmallBalances,
  })
)(withThemeContext(RecyclerAssetList));
