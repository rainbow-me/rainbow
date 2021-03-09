import { findIndex, get, isNil } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  RefreshControl,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import { LayoutProvider } from 'recyclerlistview';
import styled from 'styled-components';
import { withThemeContext } from '../../../context/ThemeContext';
import { CoinDivider } from '../../coin-divider';
import { CoinRowHeight } from '../../coin-row';
import AssetListHeader, { AssetListHeaderHeight } from '../AssetListHeader';
import { firstCoinRowMarginTop, ViewTypes } from '../RecyclerViewTypes';

import LayoutItemAnimator from './LayoutItemAnimator';
import OldAssetRecyclerList from './OldAssetRecyclerList';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';
import hasRowChanged from './hasRowChanged';
import { deviceUtils, logger, safeAreaInsetValues } from '@rainbow-me/utils';

const StyledContainer = styled(View)`
  display: flex;
  flex: 1;
  background-color: ${({ theme: { colors } }) => colors.black};
  overflow: hidden;
`;

export type RainbowRecyclerAssetListProps = {
  readonly isCoinListEdited: boolean;
  readonly fetchData: () => Promise<unknown>;
  // TODO: This needs to be migrated into a global type.
  readonly colors: {
    readonly alpha: (color: string, alpha: number) => string;
    readonly blueGreyDark: string;
  };
  readonly nativeCurrency: string;
  readonly sections: readonly {
    readonly balances: boolean;
    readonly collectibles: boolean;
    // TODO: What is a data?
    readonly data: readonly any[];
    readonly header: {
      readonly title: string;
      readonly totalItems: number;
      readonly totalValue: string;
    };
    readonly perData: any;
    readonly pools: boolean;
    readonly renderItem: (item: any) => JSX.Element | null;
    readonly type: string;
  }[];
  readonly paddingBottom?: number;
  readonly hideHeader: boolean;
};

function RainbowRecyclerAssetList({
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
  ...extras
}: RainbowRecyclerAssetListProps): JSX.Element {
  const [showCoinListEditor, setShowCoinListEditor] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const checkEditStickyHeader = useCallback(
    (offsetY: number) => {
      const offsetHeight =
        CoinRowHeight * (RecyclerAssetListSharedState.coinDividerIndex - 1) +
        firstCoinRowMarginTop;
      if (isCoinListEdited && offsetY > offsetHeight) {
        setShowCoinListEditor(true);
      } else if (
        !!showCoinListEditor &&
        (offsetY < offsetHeight || !isCoinListEdited)
      ) {
        setShowCoinListEditor(false);
      }
    },
    [isCoinListEdited, setShowCoinListEditor, showCoinListEditor]
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
      // TODO: used to use this.isCancelled
      setIsRefreshing(false);
    }
  }, [isRefreshing, setIsRefreshing, fetchData]);
  const renderRefreshControl = useCallback(() => {
    return (
      <RefreshControl
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        style={ios ? {} : { top: 20 }}
        tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
      />
    );
  }, [handleRefresh, isRefreshing, colors]);
  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    // set globalDeviceDimensions
    // used in LayoutItemAnimator and auto-scroll logic above 👇
    const topMargin = nativeEvent.layout.y;
    const additionalPadding = 10;
    RecyclerAssetListSharedState.globalDeviceDimensions =
      deviceUtils.dimensions.height -
      topMargin -
      AssetListHeaderHeight -
      additionalPadding;
  }, []);

  const stickyRowRenderer = React.useCallback(
    // TODO: What does the data look like?
    (e: NativeSyntheticEvent<unknown>, data: Record<string, any>) => (
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
      if (isCoinListEdited) {
        checkEditStickyHeader(offsetY);
      }
    },
    [isCoinListEdited, checkEditStickyHeader]
  );

  const rowRenderer = React.useCallback(
    (type: any, data: any, index: number): JSX.Element | null => {
      if (isNil(data) || isNil(index)) {
        return null;
      }
      //const { sections, isCoinListEdited, nativeCurrency } = this.props;

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
          smallBalancedChanged:
            RecyclerAssetListSharedState.smallBalancedChanged,
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

  // pass the dataprovider
  const shouldGetDerivedStateFromProps = useCallback((props, state) => {
    const { dataProvider } = state;
    return {
      dataProvider: dataProvider.cloneWithRows(props.items),
    };
  }, []);

  const animator = useMemo(() => new LayoutItemAnimator(paddingBottom), [
    paddingBottom,
  ]);

  const layoutProvider = useMemo(() => {
    return new LayoutProvider(
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
            if (RecyclerAssetListSharedState.coinDividerIndex !== index) {
              RecyclerAssetListSharedState.coinDividerIndex = index;
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
        // Set height of element using object created above 👇
        dim.width = deviceUtils.dimensions.width;
        if (isCoinListEdited && !type.visibleDuringCoinEdit) {
          dim.height = 0;
        } else {
          dim.height = type.height;
        }
      }
    );
  }, [
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
      refreshControl: renderRefreshControl(),
    }),
    [renderRefreshControl]
  );

  const scrollIndicatorInsets = useMemo(
    () => ({
      bottom: safeAreaInsetValues.bottom,
      top: hideHeader ? 0 : AssetListHeaderHeight,
    }),
    [hideHeader]
  );

  const extendedState = useMemo(() => ({ sectionsIndices }), [sectionsIndices]);

  return (
    <StyledContainer onLayout={onLayout}>
      <OldAssetRecyclerList
        {...extras}
        animator={animator}
        areSmallCollectibles={areSmallCollectibles}
        checkEditStickyHeader={checkEditStickyHeader}
        colors={colors}
        extendedState={extendedState}
        hideHeader={hideHeader}
        isCoinListEdited={isCoinListEdited}
        items={items}
        itemsCount={itemsCount}
        layoutProvider={layoutProvider}
        nativeCurrency={nativeCurrency}
        onScroll={onScroll}
        openFamilyTabs={openFamilyTabs}
        openInvestmentCards={openInvestmentCards}
        openSavings={openSavings}
        openSmallBalances={openSmallBalances}
        paddingBottom={paddingBottom}
        renderRefreshControl={renderRefreshControl}
        rowRenderer={rowRenderer}
        scrollIndicatorInsets={scrollIndicatorInsets}
        scrollViewProps={scrollViewProps}
        sections={sections}
        sectionsIndices={sectionsIndices}
        setShowCoinListEditor={setShowCoinListEditor}
        shouldGetDerivedStateFromProps={shouldGetDerivedStateFromProps}
        showCoinListEditor={showCoinListEditor}
        stickyComponentsIndices={stickyComponentsIndices}
        stickyRowRenderer={stickyRowRenderer}
      />
    </StyledContainer>
  );
}

export default connect(
  // TODO: We need to type Redux State.
  ({
    editOptions: { isCoinListEdited },
    openSavings,
    openSmallBalances,
    openStateSettings: { openFamilyTabs, openInvestmentCards },
    settings: { nativeCurrency },
  }) => ({
    isCoinListEdited,
    nativeCurrency,
    openFamilyTabs,
    openInvestmentCards,
    openSavings,
    openSmallBalances,
  })
)(withThemeContext(RainbowRecyclerAssetList));
