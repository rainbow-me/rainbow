import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, RefreshControl, View } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { withThemeContext } from '../../../context/ThemeContext';
import { CoinRowHeight } from '../../coin-row';
import { AssetListHeaderHeight } from '../AssetListHeader';
import { firstCoinRowMarginTop } from '../RecyclerViewTypes';

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
};

function RainbowRecyclerAssetList({
  isCoinListEdited,
  fetchData,
  colors,
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

  return (
    <StyledContainer onLayout={onLayout}>
      <OldAssetRecyclerList
        {...extras}
        checkEditStickyHeader={checkEditStickyHeader}
        colors={colors}
        isCoinListEdited={isCoinListEdited}
        renderRefreshControl={renderRefreshControl}
        setShowCoinListEditor={setShowCoinListEditor}
        showCoinListEditor={showCoinListEditor}
      />
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
  }) => ({
    isCoinListEdited,
    nativeCurrency,
    openFamilyTabs,
    openInvestmentCards,
    openSavings,
    openSmallBalances,
  })
)(withThemeContext(RainbowRecyclerAssetList));
