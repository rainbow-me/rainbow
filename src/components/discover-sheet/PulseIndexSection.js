import React, { Fragment, useCallback, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { DPI_ADDRESS } from '../../references/indexes';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';
import { Text } from '../text';
import { useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

const formatItem = ({ address, name, price, symbol }, nativeCurrencySymbol) => {
  const change = `${parseFloat(
    (price.relative_change_24h || 0).toFixed(2)
  )}%`.replace('-', '');

  const value = `${nativeCurrencySymbol}${handleSignificantDecimals(
    price.value,
    2
  )} `;

  return {
    address,
    change,
    isPositive: price.relative_change_24h > 0,
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

  const { nativeCurrencySymbol } = useAccountSettings();
  const item = useMemo(() => {
    const asset = genericAssets[DPI_ADDRESS];
    if (!asset) return null;
    return formatItem(asset, nativeCurrencySymbol);
  }, [genericAssets, nativeCurrencySymbol]);

  const handlePress = useCallback(() => {
    const asset = ethereumUtils.formatGenericAsset(genericAssets[DPI_ADDRESS]);

    navigate(ios ? Routes.TOKEN_INDEX_SHEET : Routes.TOKEN_INDEX_SCREEN, {
      asset,
      type: 'token_index',
    });
  }, [genericAssets, navigate]);

  const { colors, isDarkMode } = useTheme();

  const CardShadow = useMemo(
    () => [[0, 8, 24, isDarkMode ? colors.shadow : colors.dpiMid, 0.35]],
    [colors.dpiMid, colors.shadow, isDarkMode]
  );

  if (!item) return null;

  return (
    <Fragment>
      <ButtonPressAnimation onPress={handlePress} scaleTo={0.9}>
        <ShadowStack
          backgroundColor={colors.white}
          borderRadius={24}
          shadows={CardShadow}
          style={{
            height: 70,
            marginHorizontal: 19,
            marginTop: 20,
            width: '100%',
          }}
        >
          <LinearGradient
            colors={[colors.dpiLight, colors.dpiDark]}
            end={{ x: 1, y: 0.5 }}
            overflow="hidden"
            pointerEvents="none"
            start={{ x: 0, y: 0.5 }}
            style={position.coverAsObject}
          />
          <Row>
            <Column margin={15} marginRight={10}>
              <CoinIcon shadowColor={colors.dpiDark} {...item} />
            </Column>
            <Column marginLeft={0} marginTop={13.5}>
              <Text color={colors.whiteLabel} size="large" weight="heavy">
                {item.name}
              </Text>
              <Text
                color={colors.alpha(colors.whiteLabel, 0.6)}
                size="lmedium"
                weight="semibold"
              >
                All the top DeFi tokens in one
              </Text>
            </Column>
            <Column align="end" flex={1} margin={15} marginTop={13.5}>
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
        </ShadowStack>
      </ButtonPressAnimation>
      <Row marginHorizontal={34} marginTop={8}>
        <Column flex={1} justify="start">
          <Text
            color={colors.dpiLight}
            letterSpacing="roundedMedium"
            numberOfLines={1}
            size="smedium"
            weight="semibold"
          >
            Trading at{' '}
            <Text
              color={colors.dpiLight}
              letterSpacing="roundedTight"
              numberOfLines={1}
              size="smedium"
              weight="bold"
            >
              {item.price}
            </Text>
          </Text>
        </Column>
        <Column flex={1} justify="end">
          <Text
            align="right"
            color={item.isPositive ? colors.green : colors.red}
            letterSpacing="roundedMedium"
            size="smedium"
            weight="semibold"
          >
            <Text
              align="right"
              color={item.isPositive ? colors.green : colors.red}
              letterSpacing="roundedTight"
              size="smedium"
              weight="bold"
            >
              {item.isPositive ? `↑` : `↓`} {item.change}
            </Text>{' '}
            today
          </Text>
        </Column>
      </Row>
    </Fragment>
  );
};

export default React.memo(PulseIndex);
