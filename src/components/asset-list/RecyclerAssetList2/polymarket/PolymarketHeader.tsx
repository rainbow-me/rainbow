import React, { memo } from 'react';
import * as i18n from '@/languages';
import { formatCurrency } from '@/helpers/strings';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import { SectionHeader } from '@/components/asset-list/RecyclerAssetList2/SectionHeader';
import { usePolymarketBalance } from '@/features/polymarket/stores/derived/usePolymarketBalance';

export const PolymarketHeader = memo(function PolymarketHeader({ isDarkMode }: { isDarkMode: boolean }) {
  const balance = usePolymarketBalance();

  return (
    <SectionHeader
      title={i18n.t(i18n.l.account.tab_polymarket)}
      onPress={navigateToPolymarket}
      isDarkMode={isDarkMode}
      value={formatCurrency(balance)}
    />
  );
});
