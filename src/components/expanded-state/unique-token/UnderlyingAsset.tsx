import { toLower } from 'lodash';
import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useRemoveNextToLast } from '../../../navigation/useRemoveNextToLast';
import { ButtonPressAnimation } from '../../animations';
import { UnderlyingAssetCoinRow } from '../../coin-row';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountAssets, useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

export default function UnderlyingAsset({
  pricePerUnitFormatted,
  address,
  isPositive,
  name,
  symbol,
  change,
  color,
  percentageAllocation,
  changeVisible,
}: any) {
  const { nativeCurrency } = useAccountSettings();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();
  const { allAssets } = useAccountAssets();
  const { push } = useNavigation();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));

  const removeNextToLastRoute = useRemoveNextToLast();

  const handlePress = useCallback(() => {
    const asset =
      ethereumUtils.getAsset(allAssets, toLower(address)) ||
      ethereumUtils.formatGenericAsset(
        genericAssets[toLower(address)],
        nativeCurrency
      );

    // on iOS we handle this on native side
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && removeNextToLastRoute();

    push(Routes.EXPANDED_ASSET_SHEET, {
      asset,
      type: 'token',
    });
  }, [
    address,
    allAssets,
    genericAssets,
    nativeCurrency,
    push,
    removeNextToLastRoute,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Row
      as={ButtonPressAnimation}
      key={`dpi-${address}`}
      onPress={handlePress}
      scaleTo={0.95}
      testID={`underlying-asset-${symbol}`}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Column align="start" flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <UnderlyingAssetCoinRow
          address={address}
          change={change}
          changeVisible={changeVisible}
          color={color}
          isPositive={isPositive}
          name={name}
          symbol={symbol}
        />
      </Column>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Column aling="end">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row key={`allocation-${symbol}`}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            align="right"
            color={colors.alpha(colors.blueGreyDark, 0.7)}
            letterSpacing="roundedTight"
            size="large"
            weight="medium"
          >
            {pricePerUnitFormatted}
          </Text>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column
            align="end"
            backgroundColor={colors.white}
            height={30}
            marginLeft={6}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column
              height={16}
              // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
              marginTop={android ? 8 : 3}
              width={percentageAllocation * 2}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ShadowStack
                backgroundColor={color}
                borderRadius={8}
                shadows={[[0, 3, 9, isDarkMode ? colors.shadow : color, 0.2]]}
                style={{
                  height: 16,
                  width: '100%',
                }}
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <LinearGradient
                  colors={[
                    colors.alpha(colors.whiteLabel, isDarkMode ? 0.2 : 0.3),
                    colors.alpha(colors.whiteLabel, 0),
                  ]}
                  end={{ x: 1, y: 0.5 }}
                  // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
                  overflow="hidden"
                  pointerEvents="none"
                  start={{ x: 0, y: 0.5 }}
                  style={position.coverAsObject}
                />
              </ShadowStack>
            </Column>
          </Column>
        </Row>
      </Column>
    </Row>
  );
}
