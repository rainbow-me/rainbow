import { toLower } from 'lodash';
import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useRemoveNextToLast } from '../../../navigation/useRemoveNextToLast';
import { ButtonPressAnimation } from '../../animations';
import { UnderlyingAssetCoinRow } from '../../coin-row';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import { useAccountAssets, useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';
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
}) {
  const { nativeCurrency } = useAccountSettings();

  const { colors, isDarkMode } = useTheme();
  const { allAssets } = useAccountAssets();
  const { push } = useNavigation();
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
          color={color}
          isPositive={isPositive}
          name={name}
          symbol={symbol}
        />
      </Column>
      <Column aling="end">
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
            <Column
              height={16}
              marginTop={android ? 8 : 3}
              width={percentageAllocation * 2}
            >
              <ShadowStack
                backgroundColor={color}
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
