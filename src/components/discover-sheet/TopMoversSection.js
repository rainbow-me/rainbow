import React, { useCallback, useMemo } from 'react';
import { handleSignificantDecimals } from '../../helpers/utilities';
import { useAccountSettings, useTopMovers } from '../../hooks';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/ChartExpandedState';
import { Column, ColumnWithMargins, Flex } from '../layout';
import { MarqueeList } from '../list';
import { Text } from '../text';
import EdgeFade from './EdgeFade';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function TopMoversSection() {
  const { nativeCurrencySymbol } = useAccountSettings();
  const { gainers = [], losers = [] } = useTopMovers() || {};
  const { navigate } = useNavigation();

  const handlePress = useCallback(
    item => {
      navigate(
        ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN,
        {
          asset: item,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        }
      );
    },
    [navigate]
  );

  const formatItems = useCallback(
    ({ address, name, percent_change_24h, price, symbol }) => ({
      address,
      change: `${percent_change_24h > 0 ? '+' : ''}${parseFloat(
        (percent_change_24h || 0).toFixed(2)
      )}%`,
      name,
      onPress: handlePress,
      price: `${nativeCurrencySymbol}${handleSignificantDecimals(price, 2)} `,
      symbol,
      // We’re truncating the coin name manually so the width of the text can be measured accurately
      truncatedName: `${
        name.length > 15 ? name.substring(0, 15).trim() + '...' : name
      }`,
    }),
    [handlePress, nativeCurrencySymbol]
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
    <ColumnWithMargins margin={12} marginBottom={15}>
      <Flex paddingHorizontal={19}>
        <Text size="larger" weight="heavy">
          Top Movers
        </Text>
      </Flex>

      <Column>
        {gainerItems.length !== 0 && (
          <MarqueeList items={gainerItems} speed={0.666} />
        )}
        {loserItems.length !== 0 && (
          <MarqueeList items={loserItems} speed={-0.666} />
        )}
      </Column>

      <EdgeFade />
    </ColumnWithMargins>
  );
}
