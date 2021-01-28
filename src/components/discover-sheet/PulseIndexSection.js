import React, { useCallback, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { DPI_ADDRESS } from '../../references/indexes';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/ChartExpandedState';
import { Column, Row } from '../layout';
import { Text } from '../text';
import { useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors, position } from '@rainbow-me/styles';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

export const PulseIndexShadow = [[0, 8, 24, '#8E62E9', 0.35]];

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

export default function PulseIndex() {
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

    navigate(ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN, {
      asset,
      longFormHeight: initialChartExpandedStateSheetHeight,
      type: 'token_index',
    });
  }, [genericAssets, navigate]);

  if (!item) return null;

  return (
    <ButtonPressAnimation onPress={handlePress}>
      <ShadowStack
        backgroundColor={colors.dpiPurple}
        borderRadius={24}
        shadows={PulseIndexShadow}
        style={{ height: 80, margin: 12, width: '100%' }}
      >
        <LinearGradient
          borderRadius={24}
          colors={[colors.dpiPurple, '#8150E6']}
          end={{ x: 1, y: 0.5 }}
          overflow="hidden"
          pointerEvents="none"
          start={{ x: 0, y: 0.5 }}
          style={position.coverAsObject}
        />
        <Row>
          <Column margin={15}>
            <CoinIcon {...item} />
          </Column>
          <Column margin={15} marginLeft={0}>
            <Text
              color={colors.white}
              letterSpacing="roundedMedium"
              lineHeight="paragraphSmall"
              size="larger"
              weight="bold"
            >
              {item.name}
            </Text>
            <Text
              color={colors.alpha(colors.white, 0.6)}
              letterSpacing="roundedMedium"
              lineHeight="paragraphSmall"
              size="lmedium"
              weight="semibold"
            >
              All the top DeFi tokens in one
            </Text>
          </Column>
          <Column align="end" flex={1} margin={15}>
            <Text
              align="right"
              color={colors.white}
              letterSpacing="roundedMedium"
              lineHeight="paragraphSmall"
              size="larger"
              weight="bold"
            >
              􀯼
            </Text>
          </Column>
        </Row>
      </ShadowStack>
      <Row margin={28} marginTop={0}>
        <Column flex={1} justify="start">
          <Text
            align="left"
            color={colors.dpiPurple}
            numberOfLines={1}
            size="lmedium"
            weight="semibold"
          >
            Trading at {item.price}
          </Text>
        </Column>
        <Column flex={1} justify="end">
          <Text
            align="right"
            color={item.isPositive ? colors.green : colors.red}
            size="lmedium"
            weight="semibold"
          >
            {item.isPositive ? `↑` : `↓`} {item.change} today
          </Text>
        </Column>
      </Row>
    </ButtonPressAnimation>
  );
}
