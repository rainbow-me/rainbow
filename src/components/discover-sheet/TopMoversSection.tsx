import { toLower } from 'lodash';
import React, { useCallback, useMemo } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../expanded-state/asset/ChartExpandedState... Remove this comment to see the full error message
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { Centered, Column, Flex } from '../layout';
import { MarqueeList } from '../list';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './EdgeFade' was resolved to '/Users/nickby... Remove this comment to see the full error message
import EdgeFade from './EdgeFade';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  useAccountAssets,
  useAccountSettings,
  useTopMovers,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

const ErrorMessage = ({ colors, children }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Centered marginVertical={50}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
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
  const { allAssets } = useAccountAssets();
  const { network } = useAccountSettings();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const handlePress = useCallback(
    asset => {
      const assetFormatted =
        ethereumUtils.getAsset(allAssets, toLower(asset.address)) || asset;

      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: assetFormatted,
        fromDiscover: true,
        longFormHeight: initialChartExpandedStateSheetHeight,
        type: 'token',
      });
    },
    [allAssets, navigate]
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column marginBottom={15} marginTop={11} testID="top-movers-section">
      {(gainerItems?.length > 0 || loserItems?.length > 0) && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Flex marginBottom={12} paddingHorizontal={19}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size="larger" weight="heavy">
            Top Movers
          </Text>
        </Flex>
      )}
      {network !== networkTypes.mainnet ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ErrorMessage colors={colors}>
          Top movers are disabled on Testnets
        </ErrorMessage>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Column>
          {gainerItems?.length !== 0 && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <MarqueeList
              items={gainerItems}
              speed={IS_TESTING !== 'true' ? 40 : 0}
              testID="top-gainers"
            />
          )}
          {loserItems?.length !== 0 && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <MarqueeList
              items={loserItems}
              speed={IS_TESTING !== 'true' ? -40 : 0}
              testID="top-losers"
            />
          )}
        </Column>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <EdgeFade />
    </Column>
  );
}
