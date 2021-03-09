import React, { useState } from 'react';
import { RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import { withThemeContext } from '../../../context/ThemeContext';
import { CoinRowHeight } from '../../coin-row';
import { firstCoinRowMarginTop } from '../RecyclerViewTypes';

import OldAssetRecyclerList from './OldAssetRecyclerList';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';
import { logger } from '@rainbow-me/utils';

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
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const checkEditStickyHeader = React.useCallback(
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
  const handleRefresh = React.useCallback(async () => {
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
  const renderRefreshControl = React.useCallback(() => {
    return (
      <RefreshControl
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        style={ios ? {} : { top: 20 }}
        tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
      />
    );
  }, [handleRefresh, isRefreshing, colors]);
  return (
    <OldAssetRecyclerList
      {...extras}
      checkEditStickyHeader={checkEditStickyHeader}
      colors={colors}
      isCoinListEdited={isCoinListEdited}
      renderRefreshControl={renderRefreshControl}
      setShowCoinListEditor={setShowCoinListEditor}
      showCoinListEditor={showCoinListEditor}
    />
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
