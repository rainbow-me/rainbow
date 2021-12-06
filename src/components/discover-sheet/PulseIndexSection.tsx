import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import font from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { DPI_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fontWithWidth, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { handleSignificantDecimals } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const formatItem = (
  { address, name, price, symbol }: any,
  nativeCurrencySymbol: any
) => {
  const change = `${parseFloat(
    (price?.relative_change_24h || 0).toFixed(2)
  )}%`.replace('-', '');

  const value = `${nativeCurrencySymbol}${handleSignificantDecimals(
    price?.value,
    2
  )} `;

  return {
    address,
    change,
    isPositive: price?.relative_change_24h > 0,
    name,
    price: value,
    symbol,
  };
};

const PulseIndex = () => {
  const { navigate } = useNavigation();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));

  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  const item = useMemo(() => {
    const asset = genericAssets[DPI_ADDRESS];
    if (!asset) return null;
    return formatItem(asset, nativeCurrencySymbol);
  }, [genericAssets, nativeCurrencySymbol]);

  const handlePress = useCallback(() => {
    const asset = ethereumUtils.formatGenericAsset(
      genericAssets[DPI_ADDRESS],
      nativeCurrency
    );

    analytics.track('Pressed DPI Button', { category: 'discover' });

    navigate(Routes.TOKEN_INDEX_SHEET, {
      asset,
      backgroundOpacity: 1,
      cornerRadius: 39,
      fromDiscover: true,
      type: 'token_index',
    });
  }, [genericAssets, nativeCurrency, navigate]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();

  const CardShadow = useMemo(
    () => [[0, 8, 24, isDarkMode ? colors.shadow : colors.dpiMid, 0.35]],
    [colors.dpiMid, colors.shadow, isDarkMode]
  );

  if (!item) return null;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        onPress={handlePress}
        overflowMargin={15}
        scaleTo={0.9}
        testID="dpi-button"
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View
          style={{
            height: 70,
            marginHorizontal: 19,
          }}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ShadowStack
            backgroundColor={colors.white}
            borderRadius={24}
            shadows={CardShadow}
            style={{
              height: 70,
            }}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <LinearGradient
            colors={[colors.dpiLight, colors.dpiDark]}
            end={{ x: 1, y: 0.5 }}
            // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
            overflow="hidden"
            pointerEvents="none"
            start={{ x: 0, y: 0.5 }}
            style={[
              position.coverAsObject,
              {
                borderRadius: 24,
                height: 70,
                position: 'absolute',
                zIndex: 1,
              },
            ]}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row position="absolute" zIndex={1}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column margin={15} marginRight={10}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <CoinIcon forcedShadowColor={colors.dpiDark} {...item} />
            </Column>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column marginLeft={0} marginTop={ios ? 13.5 : 6}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text color={colors.whiteLabel} size="large" weight="heavy">
                {item.name}
              </Text>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                color={colors.alpha(colors.whiteLabel, 0.6)}
                size="lmedium"
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
                style={ios ? {} : { marginTop: -10 }}
                weight="semibold"
              >
                All the top DeFi tokens in one
              </Text>
            </Column>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column align="end" flex={1} margin={15} marginTop={ios ? 13.5 : 6}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                align="right"
                color={colors.whiteLabel}
                letterSpacing="zero"
                size="large"
                weight="heavy"
              >
                􀯼
              </Text>
            </Column>
          </Row>
        </View>
      </ButtonPressAnimation>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row
        as={ButtonPressAnimation}
        flex={1}
        justify="space-between"
        marginBottom={30}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        marginTop={android ? 4 : 8}
        onPress={handlePress}
        scaleTo={0.92}
        style={{
          marginHorizontal: 34,
        }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text
          color={colors.dpiLight}
          numberOfLines={1}
          size="smedium"
          weight="semibold"
        >
          Trading at // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
          unless the '--jsx' flag is provided... Remove this comment to see the
          full error message
          <Text
            color={colors.dpiLight}
            letterSpacing="roundedMedium"
            numberOfLines={1}
            size="smedium"
            weight="bold"
          >
            {item.price}
          </Text>
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text
          align="right"
          color={item.isPositive ? colors.green : colors.red}
          letterSpacing="roundedMedium"
          numberOfLines={1}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'weight' does not exist on type '{}'.
          {...fontWithWidth(font.weight.bold)}
          size="smedium"
          weight="bold"
        >
          {item.isPositive ? `↑` : `↓`} {item.change}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            align="right"
            color={item.isPositive ? colors.green : colors.red}
            size="smedium"
            weight="semibold"
          >
            {' '}
            today
          </Text>
        </Text>
      </Row>
    </Fragment>
  );
};

export default React.memo(PulseIndex);
