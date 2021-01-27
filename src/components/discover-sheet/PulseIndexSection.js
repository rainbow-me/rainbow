import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';
import { Text } from '../text';
import { useAccountSettings } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import ShadowStack from 'react-native-shadow-stack';

export const PulseIndexShadow = [
  [0, 2, 5, colors.orange, 0.2],
  [0, 6, 10, colors.orange, 0.14],
  [0, 1, 18, colors.orange, 0.12],
];

const formatItem = ({ address, name, price, symbol }, nativeCurrencySymbol) => {
  const change = `${parseFloat((price.relative_change_24h || 0).toFixed(2))}%`;

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
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));

  const { nativeCurrencySymbol } = useAccountSettings();
  const item = useMemo(() => {
    const asset = genericAssets['0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b'];
    if (!asset) return null;
    return formatItem(asset, nativeCurrencySymbol);
  }, [genericAssets, nativeCurrencySymbol]);

  if (!item) return null;

  return (
    <ButtonPressAnimation onPress={() => null}>
      <ShadowStack
        backgroundColor="#9B74EC"
        borderRadius={24}
        shadows={PulseIndexShadow}
        style={{ height: 80, margin: 12, width: '100%' }}
      >
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
            color="#9B74EC"
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
