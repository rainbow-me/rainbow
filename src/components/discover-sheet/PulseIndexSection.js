import lang from 'i18n-js';
import React, { Fragment, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import font from '../../styles/fonts';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';
import { analytics } from '@/analytics';
import { Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { useNavigation } from '@/navigation';
import { DPI_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import { fontWithWidth } from '@/styles';
import { handleSignificantDecimals } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import ShadowStack from '@/react-native-shadow-stack';

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
        style={{ marginBottom: 12 }}
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
          >
            <LinearGradient
              colors={[colors.dpiLight, colors.dpiDark]}
              end={{ x: 1, y: 0.5 }}
              overflow="hidden"
              pointerEvents="none"
              start={{ x: 0, y: 0.5 }}
              style={{ flex: 1, flexDirection: 'row' }}
            >
              <Column margin={15} marginRight={10}>
                <CoinIcon forcedShadowColor={colors.dpiDark} {...item} />
              </Column>
              <Column
                flex={1}
                justify="space-between"
                marginVertical={18}
                paddingRight={19}
              >
                <Text
                  color={{ custom: colors.whiteLabel }}
                  size="18px / 27px (Deprecated)"
                  weight="heavy"
                >
                  {item.name}
                </Text>
                <Text
                  color={{ custom: colors.alpha(colors.whiteLabel, 0.6) }}
                  numberOfLines={1}
                  size="16px / 22px (Deprecated)"
                  weight="semibold"
                >
                  {lang.t('discover.pulse.pulse_description')}
                </Text>
              </Column>
              <Column
                margin={15}
                marginLeft={0}
                style={{ position: 'absolute', right: 0, top: 4 }}
              >
                <Text
                  align="right"
                  color={{ custom: colors.whiteLabel }}
                  letterSpacing="0px"
                  size="18px / 27px (Deprecated)"
                  weight="heavy"
                >
                  􀯼
                </Text>
              </Column>
            </LinearGradient>
          </ShadowStack>
        </View>
      </ButtonPressAnimation>
      <ButtonPressAnimation
        flex={1}
        marginTop={android ? 4 : 8}
        onPress={handlePress}
        scaleTo={0.92}
        style={{
          marginBottom: 34,
          marginHorizontal: 34,
        }}
      >
        <Row justify="space-between">
          <Text
            color={{ custom: colors.dpiLight }}
            numberOfLines={1}
            size="14px / 19px (Deprecated)"
            weight="bold"
          >
            Trading at{' '}
            <Text
              color={{ custom: colors.dpiLight }}
              letterSpacing="roundedMedium"
              numberOfLines={1}
              size="14px / 19px (Deprecated)"
              weight="bold"
            >
              {item.price}
            </Text>
          </Text>
          <Text
            align="right"
            color={{ custom: item.isPositive ? colors.green : colors.red }}
            letterSpacing="roundedMedium"
            numberOfLines={1}
            {...fontWithWidth(font.weight.bold)}
            size="14px / 19px (Deprecated)"
            weight="bold"
          >
            {item.isPositive ? `↑` : `↓`} {item.change}
            <Text
              align="right"
              color={{ custom: item.isPositive ? colors.green : colors.red }}
              size="14px / 19px (Deprecated)"
              weight="bold"
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
