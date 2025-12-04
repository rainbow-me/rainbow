import React, { memo } from 'react';
import * as i18n from '@/languages';
import { formatCurrency } from '@/helpers/strings';
import { SectionHeader } from '@/components/asset-list/RecyclerAssetList2/SectionHeader';
import { usePolymarketAccountValue } from '@/features/polymarket/stores/derived/usePolymarketAccountValue';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export const PolymarketHeader = memo(function PolymarketHeader({ isDarkMode }: { isDarkMode: boolean }) {
  const accountValueNative = usePolymarketAccountValue();

  return (
    <SectionHeader
      title={i18n.t(i18n.l.account.tab_polymarket)}
      onPress={() => Navigation.handleAction(Routes.POLYMARKET_NAVIGATOR)}
      isDarkMode={isDarkMode}
      value={formatCurrency(accountValueNative)}
    />
  );
});
