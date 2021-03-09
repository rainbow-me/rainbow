import React, { useState } from 'react';
import { connect } from 'react-redux';
import { withThemeContext } from '../../../context/ThemeContext';

import OldAssetRecyclerList from './OldAssetRecyclerList';

export type RainbowRecyclerAssetListProps = {};

function RainbowRecyclerAssetList({
  ...extras
}: RainbowRecyclerAssetListProps): JSX.Element {
  const [showCoinListEditor, setShowCoinListEditor] = useState<boolean>();
  return (
    <OldAssetRecyclerList
      {...extras}
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
