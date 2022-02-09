import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { Fragment, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import font from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';
import { Text } from '../text';
import { useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { DPI_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { fontWithWidth, position } from '@rainbow-me/styles';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

const formatItem = ({ address, name, price, symbol }, nativeCurrencySymbol) => {
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

  const { colors, isDarkMode } = useTheme();

  const CardShadow = useMemo(
    () => [[0, 8, 24, isDarkMode ? colors.shadow : colors.dpiMid, 0.35]],
    [colors.dpiMid, colors.shadow, isDarkMode]
  );

  if (!item) return null;

  return (
    <Fragment>
      <ButtonPressAnimation
        onPress={handlePress}
        overflowMargin={15}
        scaleTo={0.9}
        testID="dpi-button"
      >
        <View
          style={{
            height: 70,
            marginHorizontal: 19,
          }}
        >
          <ShadowStack
            backgroundColor={colors.white}
            borderRadius={24}
            shadows={CardShadow}
            style={{
              height: 70,
            }}
          />

          <LinearGradient
            colors={[colors.dpiLight, colors.dpiDark]}
            end={{ x: 1, y: 0.5 }}
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
          <Row position="absolute" zIndex={1}>
            <Column margin={15} marginRight={10}>
              <CoinIcon forcedShadowColor={colors.dpiDark} {...item} />
            </Column>
            <Column marginLeft={0} marginTop={ios ? 13.5 : 6}>
              <Text color={colors.whiteLabel} size="large" weight="heavy">
                {item.name}
              </Text>
              <Text
                color={colors.alpha(colors.whiteLabel, 0.6)}
                size="lmedium"
                style={ios ? {} : { marginTop: -10 }}
                weight="semibold"
              >
                {lang.t('discover.pulse.pulse_description')}
              </Text>
            </Column>
            <Column
              align="end"
              flex={1}
              marginRight={15}
              marginTop={ios ? 13.5 : 6}
            >
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
      <ButtonPressAnimation
        flex={1}
        marginBottom={30}
        marginTop={android ? 4 : 8}
        onPress={handlePress}
        scaleTo={0.92}
        style={{
          marginHorizontal: 34,
        }}
      >
        <Row justify="space-between">
          <Text
            color={colors.dpiLight}
            numberOfLines={1}
            size="smedium"
            weight="semibold"
          >
            Trading at{' '}
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
          <Text
            align="right"
            color={item.isPositive ? colors.green : colors.red}
            letterSpacing="roundedMedium"
            numberOfLines={1}
            {...fontWithWidth(font.weight.bold)}
            size="smedium"
            weight="bold"
          >
            {item.isPositive ? `↑` : `↓`} {item.change}
            <Text
              align="right"
              color={item.isPositive ? colors.green : colors.red}
              size="smedium"
              weight="semibold"
            >
              {' '}
              {lang.t('discover.pulse.today_suffix')}
            </Text>
          </Text>
        </Row>
      </ButtonPressAnimation>
    </Fragment>
  );
};

export default React.memo(PulseIndex);
