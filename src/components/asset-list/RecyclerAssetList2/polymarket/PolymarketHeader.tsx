import React, { memo } from 'react';
import * as i18n from '@/languages';
import { formatCurrency } from '@/helpers/strings';
import { SectionHeader } from '@/components/asset-list/RecyclerAssetList2/SectionHeader';
import { usePolymarketAccountValue } from '@/features/polymarket/stores/derived/usePolymarketAccountValue';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';

export const PolymarketHeader = memo(function PolymarketHeader({ isDarkMode }: { isDarkMode: boolean }) {
  const accountValueNative = usePolymarketAccountValue();

  return (
    <SectionHeader
      title={i18n.t(i18n.l.account.tab_polymarket)}
      onPress={navigateToPolymarket}
      isDarkMode={isDarkMode}
      value={formatCurrency(accountValueNative)}
    />
  );
});
