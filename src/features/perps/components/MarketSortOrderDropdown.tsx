import React, { memo, useCallback } from 'react';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import { MarketSortOrder } from '@/features/perps/types';
import { hyperliquidMarketsActions, useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { useMarketSortOrderLabels } from '@/features/perps/hooks/useMarketSortOrderLabels';

export const MarketSortOrderDropdown = memo(function MarketSortOrderDropdown({ children }: { children: React.ReactElement }) {
  const selectedSortOrder = useHyperliquidMarketsStore(state => state.sortOrder);
  const marketSortOrderLabels = useMarketSortOrderLabels();

  const buildMarketSortOrderMenuItems = useCallback(
    (selectedSortOrder: MarketSortOrder): MenuItem<MarketSortOrder>[] => {
      return Object.values(MarketSortOrder).map(sortOrder => {
        return {
          actionTitle: marketSortOrderLabels[sortOrder].label,
          actionKey: sortOrder,
          icon: { iconType: 'SYSTEM', iconValue: marketSortOrderLabels[sortOrder].iconName },
          menuState: sortOrder === selectedSortOrder ? 'on' : 'off',
        };
      });
    },
    [marketSortOrderLabels]
  );

  return (
    <DropdownMenu<MarketSortOrder>
      menuItemType="checkbox"
      menuConfig={{
        menuItems: buildMarketSortOrderMenuItems(selectedSortOrder),
      }}
      onPressMenuItem={sortOrder => hyperliquidMarketsActions.setSortOrder(sortOrder)}
    >
      {children}
    </DropdownMenu>
  );
});
