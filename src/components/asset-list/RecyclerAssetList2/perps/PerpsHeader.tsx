import React, { memo } from 'react';
import * as i18n from '@/languages';
import { formatCurrency } from '@/helpers/strings';
import { useHyperliquidBalance } from '@/features/perps/stores/derived/useHyperliquidBalance';
import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';
import { SectionHeader } from '@/components/asset-list/RecyclerAssetList2/SectionHeader';

export const PerpsHeader = memo(function PerpsHeader({ isDarkMode }: { isDarkMode: boolean }) {
  const accountValueNative = useHyperliquidBalance();

  return (
    <SectionHeader
      title={i18n.t(i18n.l.account.tab_perps)}
      onPress={navigateToPerps}
      isDarkMode={isDarkMode}
      value={formatCurrency(accountValueNative)}
    />
  );
});
