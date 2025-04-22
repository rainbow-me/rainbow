import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { LayoutChangeEvent, PixelRatio, RefreshControl, ScrollViewProps, StyleSheet, View } from 'react-native';
import { DataProvider, LayoutProvider, RecyclerListView } from 'recyclerlistview';
import { RecyclerListViewProps, RecyclerListViewState } from 'recyclerlistview/dist/reactnative/core/RecyclerListView';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import { withThemeContext } from '../../../theme/ThemeContext';
import { CoinDivider, CoinDividerHeight } from '../../coin-divider';
import { CoinRowHeight } from '../../coin-row';
import AssetListHeader, { AssetListHeaderHeight } from '../AssetListHeader';
import { firstCoinRowMarginTop, ViewTypes } from '../RecyclerViewTypes';
import LayoutItemAnimator from './LayoutItemAnimator';
import { EthereumAddress } from '@/entities';
import { useCoinListEdited, useOpenFamilies, useOpenSmallBalances, usePrevious, useRefreshAccountData } from '@/hooks';
import styled from '@/styled-thing';
import { deviceUtils } from '@/utils';
import * as i18n from '@/languages';

const extractCollectiblesIdFromRow = (row: {
  item: {
    tokens: { asset_contract: { address: EthereumAddress }; id: string }[][];
  };
}) => {
  try {
    let tokenAddresses = '';
    row.item?.tokens?.forEach((token: { asset_contract: { address: EthereumAddress }; id: string }[]) => {
      token.forEach((individualToken: { asset_contract: { address: EthereumAddress }; id: string }) => {
        tokenAddresses += `${individualToken?.asset_contract?.address}|${individualToken?.id}||`;
      });
    });
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

const defaultIndices = [0];
const isEqualDataProvider = new DataProvider((r1, r2) => {
  // Last placeholder
  if (r1.isLastPlaceholder) {
    return r1.isLastPlaceholder === r2.isLastPlaceholder;
    // coinDivider
  } else if (r1.item?.coinDivider) {
    return r1.item?.value === r2.item?.value;
    // Family sections
  } else if (r1.familySectionIndex === 0 || r1.familySectionIndex > 0) {
    const nftsRow1 = extractCollectiblesIdFromRow(r1);
    const nftsRow2 = extractCollectiblesIdFromRow(r2);
    return r1.item.childrenAmount === r2.item?.childrenAmount && r1.item.familyName === r2.item?.familyName && isEqual(nftsRow1, nftsRow2);

    // Coin Rows
  } else if (r1.item?.address) {
    const slimR1 = extractRelevantAssetInfo(r1.item);
    const slimR2 = extractRelevantAssetInfo(r2.item);
    return isEqual(slimR1, slimR2);
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

const StyledRecyclerListView = styled(RecyclerListView)({
  // @ts-expect-error
  backgroundColor: ({ theme: { colors } }) => colors.white,
  display: 'flex',
  flex: 1,
  minHeight: 1,
});

const StyledContainer = styled(View)({
  // @ts-expect-error
  backgroundColor: ({ theme: { colors } }) => colors.white,
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
});

type RecyclerListViewRef = RecyclerListView<RecyclerListViewProps, RecyclerListViewState>;

export function useRecyclerListViewRef(): {
  readonly handleRef: (ref: RecyclerListViewRef) => void;
  readonly ref: RecyclerListViewRef | undefined;
  readonly _ref: React.MutableRefObject<RecyclerListViewRef | undefined>;
} {
  const ref = useRef<RecyclerListViewRef>();
  const handleRef = React.useCallback(
    (nextRef: RecyclerListViewRef): void => {
      ref.current = nextRef;
      return;
    },
    [ref]
  );

  return { handleRef, ref: ref.current, _ref: ref };
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
  readonly renderItem: (item: any) => JSX.Element | null;
  readonly type: string;
};

const NoStickyContainer = ({ children }: { children: JSX.Element }): JSX.Element => children;

export type RecyclerAssetListProps = {
  // TODO: This needs to be migrated into a global type.
  readonly colors: {
    readonly alpha: (color: string, alpha: number) => string;
    readonly blueGreyDark: string;
  };
  readonly sections: readonly RecyclerAssetListSection[];
  readonly paddingBottom?: number;
  readonly hideHeader: boolean;
  readonly renderAheadOffset?: number;
  readonly showcase?: boolean;
  readonly disableStickyHeaders?: boolean;
  readonly disableAutoScrolling?: boolean;
  readonly disableRefreshControl?: boolean;
};

function RecyclerAssetList({
  colors,
  sections,
  paddingBottom = 0,
  hideHeader,
  renderAheadOffset = deviceUtils.dimensions.height,
  showcase,
  disableStickyHeaders,
  disableAutoScrolling,
  disableRefreshControl,
  ...extras
}: RecyclerAssetListProps): JSX.Element {
  const { isCoinListEdited, setIsCoinListEdited } = useCoinListEdited();
  const { refresh, isRefreshing } = useRefreshAccountData();
  const { isSmallBalancesOpen: openSmallBalances } = useOpenSmallBalances();
  const { openFamilies: openFamilyTabs } = useOpenFamilies();
  const { ref, handleRef } = useRecyclerListViewRef();
  const stickyCoinDividerRef = React.useRef<View>() as React.RefObject<View>;
  const [globalDeviceDimensions, setGlobalDeviceDimensions] = useState<number>(0);
  const { areSmallCollectibles, items, itemsCount, sectionsIndices, stickyComponentsIndices } = useMemo(() => {
    const sectionsIndices: number[] = [];
    const stickyComponentsIndices: number[] = [];
    const items = sections.reduce((ctx: any[], section) => {
      sectionsIndices.push(ctx.length);
      stickyComponentsIndices.push(ctx.length);
      ctx = ctx.concat([
        {
          isHeader: true,
          ...section.header,
        },
      ]);
      if (section.collectibles) {
        section.data.forEach((item, index) => {
          if (item.isHeader || openFamilyTabs[item.familyName + (showcase ? '-showcase' : '')]) {
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
      return ctx;
    }, []);
    items.push({ item: { isLastPlaceholder: true }, renderItem: () => null });
    const areSmallCollectibles = (c => c && c?.type === 'small')(sections.find(e => e.collectibles));
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
      return items.findIndex(({ item }) => item?.coinDivider);
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
      const offsetHeight = CoinRowHeight * (coinDividerIndex - 1) + firstCoinRowMarginTop;
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
  const onLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      // set globalDeviceDimensions
      // used in LayoutItemAnimator and auto-scroll logic above 👇
      const topMargin = nativeEvent.layout.y;
      const additionalPadding = 10;
      setGlobalDeviceDimensions(deviceUtils.dimensions.height - topMargin - AssetListHeaderHeight - additionalPadding);
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
        return (showcase ? ViewTypes.SHOWCASE_HEADER : ViewTypes.HEADER).renderComponent({
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

        const balancesIndex = sections.findIndex(({ name }) => name === 'balances');
        const collectiblesIndex = sections.findIndex(({ name }) => name === 'collectibles');

        if (sectionsIndices.includes(index)) {
          return {
            height: (showcase ? ViewTypes.SHOWCASE_HEADER : ViewTypes.HEADER).calculateHeight({
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

        if (balancesIndex > -1 && (index <= sectionsIndices[collectiblesIndex] || collectiblesIndex < 0)) {
          const balanceItemsCount = sections?.[balancesIndex]?.data.length ?? 0;
          const lastBalanceIndex = sectionsIndices[balancesIndex] + balanceItemsCount;
          if (index === lastBalanceIndex - 2) {
            if (sections[balancesIndex].data[lastBalanceIndex - 2].smallBalancesContainer) {
              return {
                height: ViewTypes.COIN_DIVIDER.calculateHeight(),
                index: ViewTypes.COIN_DIVIDER.index,
                visibleDuringCoinEdit: ViewTypes.COIN_DIVIDER.visibleDuringCoinEdit,
              };
            }
          }
          if (index === lastBalanceIndex - 1) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 2] &&
              sections[balancesIndex].data[lastBalanceIndex - 2].smallBalancesContainer
            ) {
              const smallBalancesIndex = index - 1;
              return {
                height: ViewTypes.COIN_SMALL_BALANCES.calculateHeight({
                  isCoinListEdited: isCoinListEdited,
                  isOpen: openSmallBalances,
                  smallBalancesLength: sections[balancesIndex].data[smallBalancesIndex].assets.length,
                }),
                index: ViewTypes.COIN_SMALL_BALANCES.index,
                visibleDuringCoinEdit: ViewTypes.COIN_SMALL_BALANCES.visibleDuringCoinEdit,
              };
            }
          }
          const firstBalanceIndex = sectionsIndices[balancesIndex] + 1;
          const isFirst = index === firstBalanceIndex && !sections[balancesIndex].data[firstBalanceIndex - 1].smallBalancesContainer;

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
            const isHeader = sections[collectiblesIndex].data[familyIndex].isHeader;
            return {
              height: ViewTypes.UNIQUE_TOKEN_ROW.calculateHeight({
                amountOfRows: sections?.[collectiblesIndex]?.data?.[familyIndex]?.tokens?.length ?? 0,
                isFirst,
                isHeader,
                isOpen: openFamilyTabs[sections[collectiblesIndex].data[familyIndex].familyName + (showcase ? '-showcase' : '')],
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
        const element = type as unknown as {
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
    openSmallBalances,
    paddingBottom,
    sections,
    sectionsIndices,
    showcase,
  ]);
  layoutProvider.shouldRefreshWithAnchoring = false;

  const scrollViewProps = useMemo(
    (): Partial<ScrollViewProps> =>
      disableRefreshControl
        ? {}
        : {
            refreshControl: (
              <RefreshControl
                onRefresh={refresh}
                progressViewOffset={android ? 30 : 0}
                refreshing={isRefreshing}
                tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
              />
            ),
          },
    [disableRefreshControl, refresh, isRefreshing, colors]
  );

  const extendedState = useMemo(() => ({ sectionsIndices }), [sectionsIndices]);

  const dataProvider = useMemo(() => {
    return isEqualDataProvider.cloneWithRows(items);
  }, [items]);

  const lastSections = usePrevious(sections) || sections;
  const lastOpenFamilyTabs = usePrevious(openFamilyTabs) || openFamilyTabs;
  const lastIsCoinListEdited = usePrevious(isCoinListEdited) || isCoinListEdited;

  useEffect(() => {
    lastIsCoinListEdited !== isCoinListEdited && checkEditStickyHeader(0);
  }, [lastIsCoinListEdited, isCoinListEdited, checkEditStickyHeader]);

  useEffect(() => {
    let collectibles: RecyclerAssetListSection = {} as RecyclerAssetListSection;
    let prevCollectibles: RecyclerAssetListSection = {} as RecyclerAssetListSection;
    let balances: RecyclerAssetListSection = {} as RecyclerAssetListSection;
    let smallBalances: any = {};

    if (sections) {
      sections.forEach(section => {
        if (section?.collectibles) {
          collectibles = section;
        }
        if (section?.balances) {
          balances = section;
        }
      });

      const balancesRows = [];
      let coinDividerHeight = 0;

      balances?.data?.forEach(element => {
        if (element?.smallBalancesContainer) {
          smallBalances = element;
        } else if (element?.coinDivider) {
          coinDividerHeight = CoinDividerHeight;
        } else {
          balancesRows.push(element);
        }
      });
      const balancesHeight = balancesRows.length * CoinRowHeight;
      // -3 for pixel perfection
      const smallBalancesHeight =
        ViewTypes.COIN_SMALL_BALANCES.calculateHeight({
          isCoinListEdited: isCoinListEdited,
          isOpen: openSmallBalances,
          smallBalancesLength: smallBalances?.assets?.length || 0,
        }) +
        coinDividerHeight -
        3;

      const colleciblesStartHeight = balancesHeight + smallBalancesHeight;

      lastSections.forEach(section => {
        if (section.collectibles) {
          prevCollectibles = section;
        }
      });

      // Auto-scroll to showcase family if something was added/removed 👇
      if (
        collectibles.data &&
        prevCollectibles.data &&
        collectibles.data[0]?.familyName === i18n.t(i18n.l.account.tab_showcase) &&
        (collectibles.data[0]?.childrenAmount > prevCollectibles.data[0]?.childrenAmount ||
          prevCollectibles.data[0]?.familyName !== i18n.t(i18n.l.account.tab_showcase))
      ) {
        const showcaseHeight = colleciblesStartHeight + AssetListHeaderHeight;
        setTimeout(() => !disableAutoScrolling && ref?.scrollToOffset(0, showcaseHeight, true), 100);
      }
    }
  }, [
    ref,
    disableAutoScrolling,
    globalDeviceDimensions,
    dataProvider,
    lastIsCoinListEdited,
    lastOpenFamilyTabs,
    lastSections,
    sections,
    isCoinListEdited,
    openFamilyTabs,
    openSmallBalances,
    paddingBottom,
    showcase,
  ]);

  const MaybeStickyContainer = disableStickyHeaders ? NoStickyContainer : StickyContainer;

  const isInsideBottomSheet = !!useContext(BottomSheetContext);

  const coinDividerExtendedState = useMemo(
    () => ({
      isCoinListEdited,
      setIsCoinListEdited,
    }),
    [isCoinListEdited, setIsCoinListEdited]
  );

  return (
    <StyledContainer onLayout={onLayout}>
      {/* @ts-ignore */}
      <MaybeStickyContainer
        overrideRowRenderer={stickyRowRenderer}
        stickyHeaderIndices={disableStickyHeaders ? [] : isCoinListEdited ? defaultIndices : stickyComponentsIndices}
      >
        {/* @ts-ignore */}
        <StyledRecyclerListView
          automaticallyAdjustsScrollIndicatorInsets={false}
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
          scrollIndicatorInsets={{ bottom: 200, top: 300 }}
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
        <CoinDivider balancesSum={0} defaultToEditButton={false} extendedState={coinDividerExtendedState} />
      </View>
    </StyledContainer>
  );
}

export default withThemeContext(RecyclerAssetList);
