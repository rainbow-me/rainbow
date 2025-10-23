import React, { memo } from 'react';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import { MarketSortOrder } from '@/features/perps/types';
import { hyperliquidMarketsActions, useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { MARKET_SORT_ORDER_LABELS } from '@/features/perps/constants';

export const MarketSortOrderDropdown = memo(function MarketSortOrderDropdown({ children }: { children: React.ReactElement }) {
  const selectedSortOrder = useHyperliquidMarketsStore(state => state.sortOrder);

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

function buildMarketSortOrderMenuItems(selectedSortOrder: MarketSortOrder): MenuItem<MarketSortOrder>[] {
  return Object.values(MarketSortOrder).map(sortOrder => ({
    actionTitle: MARKET_SORT_ORDER_LABELS[sortOrder].label,
    actionKey: sortOrder,
    icon: { iconType: 'SYSTEM', iconValue: MARKET_SORT_ORDER_LABELS[sortOrder].iconName },
    menuState: sortOrder === selectedSortOrder ? 'on' : 'off',
  }));
}
