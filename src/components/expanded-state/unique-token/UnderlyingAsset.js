import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useRemoveNextToLast } from '../../../navigation/useRemoveNextToLast';
import { ButtonPressAnimation } from '../../animations';
import UnderlyingAssetCoinRow from '../../coin-row/UnderlyingAssetCoinRow';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import { useAccountSettings, useColorForAsset } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { position } from '@/styles';
import { ethereumUtils } from '@/utils';
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
  asset,
  marginRight,
}) {
  const { nativeCurrency } = useAccountSettings();

  const { colors, isDarkMode } = useTheme();
  const { push } = useNavigation();
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));

  const removeNextToLastRoute = useRemoveNextToLast();

  const handlePress = useCallback(() => {
    const asset =
      ethereumUtils.getAccountAsset(address) ||
      ethereumUtils.formatGenericAsset(
        genericAssets[address?.toLowerCase()],
        nativeCurrency
      );

    // on iOS we handle this on native side
    android && removeNextToLastRoute();

    push(Routes.EXPANDED_ASSET_SHEET, {
      asset,
      type: 'token',
    });
  }, [address, genericAssets, nativeCurrency, push, removeNextToLastRoute]);

  const colorFromAsset = useColorForAsset(asset, color);

  const columnWidth = Math.max(3, percentageAllocation * 2);

  return (
    <Row
      as={ButtonPressAnimation}
      key={`dpi-${address}`}
      onPress={handlePress}
      scaleTo={0.95}
      testID={`underlying-asset-${symbol}`}
    >
      <Column align="start" flex={1}>
        <UnderlyingAssetCoinRow
          address={address}
          change={change}
          changeVisible={changeVisible}
          color={colorFromAsset}
          isPositive={isPositive}
          name={name}
          symbol={symbol}
        />
      </Column>
      <Column aling="end" marginRight={marginRight}>
        <Row key={`allocation-${symbol}`}>
          <Text
            align="right"
            color={colors.alpha(colors.blueGreyDark, 0.7)}
            letterSpacing="roundedTight"
            size="large"
            weight="medium"
          >
            {pricePerUnitFormatted}
          </Text>
          <Column
            align="end"
            backgroundColor={colors.white}
            height={30}
            marginLeft={6}
          >
            <Column height={16} marginTop={ios ? 3 : 8} width={columnWidth}>
              <ShadowStack
                backgroundColor={colorFromAsset}
                borderRadius={8}
                shadows={[[0, 3, 9, isDarkMode ? colors.shadow : color, 0.2]]}
                style={{
                  height: 16,
                  width: '100%',
                }}
              >
                <LinearGradient
                  colors={[
                    colors.alpha(colors.whiteLabel, isDarkMode ? 0.2 : 0.3),
                    colors.alpha(colors.whiteLabel, 0),
                  ]}
                  end={{ x: 1, y: 0.5 }}
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
