import React, { useCallback, useMemo } from 'react';
import { handleSignificantDecimals } from '../../helpers/utilities';
import { useAccountSettings, useTopMovers } from '../../hooks';
import { uniswapPairs } from '../../references';
import { measureTopMoverCoinRow } from '../coin-row';
import { Column, ColumnWithMargins } from '../layout';
import { MarqueeList } from '../list';
import { Text } from '../text';

export default function TopMoversSection() {
  const { nativeCurrencySymbol } = useAccountSettings();
  const { gainers = [], losers = [] } = useTopMovers();

  const formatItems = useCallback(
    ({ address, name, percent_change_24h, price, symbol }) => ({
      address,
      change: `${parseFloat((percent_change_24h || 0).toFixed(2))}%`,
      name: uniswapPairs[address]?.name || name,
      price: `${nativeCurrencySymbol}${handleSignificantDecimals(price, 2)}`,
      symbol,
    }),
    [nativeCurrencySymbol]
  );

  const gainerItems = useMemo(() => gainers.map(formatItems), [
    formatItems,
    gainers,
  ]);

  const loserItems = useMemo(() => losers.map(formatItems), [
    formatItems,
    losers,
  ]);

  return (
    <ColumnWithMargins margin={15}>
      <Text size="larger" weight="bold">
        Top Movers
      </Text>
      <Column>
        <MarqueeList items={gainerItems} measureItem={measureTopMoverCoinRow} />
        <MarqueeList items={loserItems} measureItem={measureTopMoverCoinRow} />
      </Column>
    </ColumnWithMargins>
  );
}
