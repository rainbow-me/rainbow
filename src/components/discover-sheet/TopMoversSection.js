import React, { useCallback, useMemo } from 'react';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/ChartExpandedState';
import { Column, Flex } from '../layout';
import { MarqueeList } from '../list';
import { Text } from '../text';
import EdgeFade from './EdgeFade';
import { useTopMovers } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function TopMoversSection() {
  const { gainers = [], losers = [] } = useTopMovers() || {};
  const { navigate } = useNavigation();

  const handlePress = useCallback(
    asset => {
      navigate(
        ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN,
        {
          asset,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        }
      );
    },
    [navigate]
  );

  const formatItems = useCallback(
    asset => {
      const {
        name,
        native: { change },
        price: { relative_change_24h },
      } = asset;
      return {
        ...asset,
        change: `${relative_change_24h > 0 ? '+' : ''}${change}`,
        onPress: handlePress,
        // We’re truncating the coin name manually so the width of the text can be measured accurately
        truncatedName: `${
          name?.length > 15 ? name.substring(0, 15).trim() + '...' : name
        }`,
      };
    },
    [handlePress]
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
    <Column marginBottom={15} marginTop={11}>
      <Flex marginBottom={12} paddingHorizontal={19}>
        <Text size="larger" weight="heavy">
          Top Movers
        </Text>
      </Flex>

      <Column>
        {gainerItems?.length !== 0 && (
          <MarqueeList items={gainerItems} speed={300} />
        )}
        {loserItems?.length !== 0 && (
          <MarqueeList items={loserItems} speed={-300} />
        )}
      </Column>

      <EdgeFade />
    </Column>
  );
}
