import React, { useState } from 'react';
import { connect } from 'react-redux';
import { withThemeContext } from '../../../context/ThemeContext';
import { CoinRowHeight } from '../../coin-row';
import { firstCoinRowMarginTop } from '../RecyclerViewTypes';

import OldAssetRecyclerList from './OldAssetRecyclerList';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';

export type RainbowRecyclerAssetListProps = {
  readonly isCoinListEdited: boolean;
};

function RainbowRecyclerAssetList({
  isCoinListEdited,
  ...extras
}: RainbowRecyclerAssetListProps): JSX.Element {
  const [showCoinListEditor, setShowCoinListEditor] = useState<boolean>(false);
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
  return (
    <OldAssetRecyclerList
      {...extras}
      checkEditStickyHeader={checkEditStickyHeader}
      isCoinListEdited={isCoinListEdited}
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
