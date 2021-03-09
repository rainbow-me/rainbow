import { isNil } from 'lodash';
import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  RefreshControl,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { withThemeContext } from '../../../context/ThemeContext';
import { CoinDivider } from '../../coin-divider';
import { CoinRowHeight } from '../../coin-row';
import AssetListHeader, { AssetListHeaderHeight } from '../AssetListHeader';
import { firstCoinRowMarginTop, ViewTypes } from '../RecyclerViewTypes';

import OldAssetRecyclerList from './OldAssetRecyclerList';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';
import { deviceUtils, logger } from '@rainbow-me/utils';

const StyledContainer = styled(View)`
  display: flex;
  flex: 1;
  background-color: ${({ theme: { colors } }) => colors.white};
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
  // TODO: What is a section?
  readonly sections: readonly any[];
};

function RainbowRecyclerAssetList({
  isCoinListEdited,
  fetchData,
  colors,
  nativeCurrency,
  sections,
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

  return (
    <StyledContainer onLayout={onLayout}>
      <OldAssetRecyclerList
        {...extras}
        checkEditStickyHeader={checkEditStickyHeader}
        colors={colors}
        isCoinListEdited={isCoinListEdited}
        nativeCurrency={nativeCurrency}
        onScroll={onScroll}
        renderRefreshControl={renderRefreshControl}
        rowRenderer={rowRenderer}
        sections={sections}
        setShowCoinListEditor={setShowCoinListEditor}
        showCoinListEditor={showCoinListEditor}
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
