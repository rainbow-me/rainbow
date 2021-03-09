import React from 'react';
import { connect } from 'react-redux';
import { withThemeContext } from '../../../context/ThemeContext';

import OldAssetRecyclerList from './OldAssetRecyclerList';

export type RainbowRecyclerAssetListProps = {};

function RainbowRecyclerAssetList({
  ...extras
}: RainbowRecyclerAssetListProps): JSX.Element {
  return <OldAssetRecyclerList {...extras} />;
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
