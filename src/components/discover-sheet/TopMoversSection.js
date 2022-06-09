import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { useSelector } from 'react-redux';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Centered, Column, Flex } from '../layout';
import { MarqueeList } from '../list';
import { Text } from '../text';
import EdgeFade from './EdgeFade';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { useAccountSettings, useTopMovers } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { parseAssetNative } from '@rainbow-me/parsers';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const ErrorMessage = ({ colors, children }) => (
  <Centered marginVertical={50}>
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.3)}
      size="large"
      weight="semibold"
    >
      {children}
    </Text>
  </Centered>
);

export default function TopMoversSection() {
  const { gainers = [], losers = [] } = useTopMovers() || {};
  const { navigate } = useNavigation();
  const { nativeCurrency, network } = useAccountSettings();
  const { colors } = useTheme();
  const assets = useSelector(({ data: { assetsData } }) => assetsData);
  const handlePress = useCallback(
    assetData => {
      const asset = assets?.[assetData.address] || assetData;
      const parsedAssetWithNative = parseAssetNative(asset, nativeCurrency);

      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: parsedAssetWithNative,
        fromDiscover: true,
        longFormHeight: initialChartExpandedStateSheetHeight,
        type: 'token',
      });
    },
    [assets, nativeCurrency, navigate]
  );

  const formatItems = useCallback(
    assetData => {
      const asset = assets?.[assetData.address] || assetData;
      const parsedAssetWithNative = parseAssetNative(asset, nativeCurrency);
      logger.debug('parsed asset with native: ', parsedAssetWithNative);
      const {
        name,
        native,
        price: { relative_change_24h },
      } = parsedAssetWithNative;
      return {
        ...parsedAssetWithNative,
        change: `${relative_change_24h > 0 ? '+' : ''}${native?.change}`,
        onPress: handlePress,
        // We’re truncating the coin name manually so the width of the text can be measured accurately
        truncatedName: `${
          name?.length > 15 ? name.substring(0, 15).trim() + '...' : name
        }`,
      };
    },
    [assets, nativeCurrency, handlePress]
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
    <Column marginBottom={15} marginTop={11} testID="top-movers-section">
      {(gainerItems?.length > 0 || loserItems?.length > 0) && (
        <Flex marginBottom={12} paddingHorizontal={19}>
          <Text size="larger" weight="heavy">
            {lang.t('discover.top_movers.top_movers_title')}
          </Text>
        </Flex>
      )}

      {network !== networkTypes.mainnet ? (
        <ErrorMessage colors={colors}>
          {lang.t('discover.top_movers.disabled_testnets')}
        </ErrorMessage>
      ) : (
        <Column>
          {gainerItems?.length !== 0 && (
            <MarqueeList
              items={gainerItems}
              speed={IS_TESTING !== 'true' ? 40 : 0}
              testID="top-gainers"
            />
          )}
          {loserItems?.length !== 0 && (
            <MarqueeList
              items={loserItems}
              speed={IS_TESTING !== 'true' ? -40 : 0}
              testID="top-losers"
            />
          )}
        </Column>
      )}

      <EdgeFade />
    </Column>
  );
}
