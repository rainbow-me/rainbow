import React, { memo } from 'react';

import { SectionHeader } from '@/components/asset-list/RecyclerAssetList2/SectionHeader';
import { useHyperliquidBalance } from '@/features/perps/stores/derived/useHyperliquidBalance';
import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';
import { formatCurrency } from '@/helpers/strings';
import * as i18n from '@/languages';

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
