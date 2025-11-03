import { useMemo } from 'react';
import * as i18n from '@/languages';
import { MarketSortOrder } from '@/features/perps/types';
import useAccountSettings from '@/hooks/useAccountSettings';

export const useMarketSortOrderLabels = () => {
  const { language } = useAccountSettings();

  const marketSortOrderLabels = useMemo(() => {
    return {
      [MarketSortOrder.VOLUME]: {
        label: i18n.t(i18n.l.perps.sort.by_volume),
        iconName: 'chart.bar.xaxis',
        icon: '􀣉',
      },
      [MarketSortOrder.CHANGE]: {
        label: i18n.t(i18n.l.perps.sort.by_change),
        iconName: 'chart.line.uptrend.xyaxis',
        icon: '􀑁',
      },
      [MarketSortOrder.PRICE]: {
        label: i18n.t(i18n.l.perps.sort.by_price),
        iconName: 'dollarsign',
        icon: '􁎢',
      },
    } as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return marketSortOrderLabels;
};
