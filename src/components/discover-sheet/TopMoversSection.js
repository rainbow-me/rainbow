import { toLower } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { handleSignificantDecimals } from '../../helpers/utilities';
import {
  useAccountAssets,
  useAccountSettings,
  useTopMovers,
} from '../../hooks';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/ChartExpandedState';
import { Column, Flex } from '../layout';
import { MarqueeList } from '../list';
import { Text } from '../text';
import EdgeFade from './EdgeFade';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';

export default function TopMoversSection() {
  const { nativeCurrencySymbol } = useAccountSettings();
  const { allAssets } = useAccountAssets();
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
  const { gainers = [], losers = [] } = useTopMovers() || {};
  const { navigate } = useNavigation();

  const handlePress = useCallback(
    item => {
      const asset =
        ethereumUtils.getAsset(allAssets, toLower(item.address)) ||
        ethereumUtils.formatGenericAsset(
          genericAssets[toLower(item.address)]
        ) ||
        item;

      navigate(
        ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN,
        {
          asset,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        }
      );
    },
    [allAssets, genericAssets, navigate]
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
        name?.length > 15 ? name.substring(0, 15).trim() + '...' : name
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
    <Column marginBottom={15} marginTop={11}>
      <Flex marginBottom={12} paddingHorizontal={19}>
        <Text size="larger" weight="heavy">
          Top Movers
        </Text>
      </Flex>

      <Column>
        {gainerItems?.length !== 0 && (
          <MarqueeList items={gainerItems} speed={666} />
        )}
        {loserItems?.length !== 0 && (
          <MarqueeList items={loserItems} speed={-666} />
        )}
      </Column>

      <EdgeFade />
    </Column>
  );
}
