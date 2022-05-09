import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../../../animations';

import { initialChartExpandedStateSheetHeight } from '../../../expanded-state/asset/ChartExpandedState';
import { ExtendedState } from '../core/RawRecyclerList';
import FastCoinIcon from './FastCoinIcon';
import { Text } from '@rainbow-me/design-system';
import { useAccountAsset } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

const formatPercentageString = (percentString?: string) =>
  percentString ? percentString.split('-').join('- ') : '-';

export default function BalanceCoinRow({
  uniqueId,
  extendedState,
}: {
  uniqueId: string;
  extendedState: ExtendedState;
}) {
  const {
    theme,
    nativeCurrencySymbol,
    navigate,
    nativeCurrency,
  } = extendedState;
  const item = useAccountAsset(uniqueId, nativeCurrency);

  const handlePress = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET, {
      asset: item,
      fromDiscover: true,
      longFormHeight: initialChartExpandedStateSheetHeight,
      type: 'token',
    });
  }, [navigate, item]);

  const percentChange = item?.native?.change;
  const percentageChangeDisplay = formatPercentageString(percentChange);

  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

  const changeColor = isPositive
    ? theme.colors.green
    : theme.colors.blueGreyDark50;

  const nativeDisplay = item?.balance?.display;

  const valueColor = nativeDisplay
    ? theme.colors.dark
    : theme.colors.blueGreyLight;

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      scaleTo={0.96}
      testID={`balance-coin-row-${item.name}`}
    >
      <View style={cx.container}>
        <FastCoinIcon address={item.address} symbol={item.address} />

        <View style={cx.innerContainer}>
          <View style={cx.row}>
            <Text align="right" size="16px" weight="medium">
              {item.name}
            </Text>

            <Text
              align="right"
              color={{ custom: valueColor }}
              size="16px"
              weight="medium"
            >
              {item?.native?.balance?.display ?? `${nativeCurrencySymbol}0.00`}
            </Text>
          </View>

          <View style={[cx.row, cx.bottom]}>
            <Text color={{ custom: theme.colors.blueGreyDark50 }} size="14px">
              {nativeDisplay ?? ''}
            </Text>

            <Text color={{ custom: changeColor }} size="14px">
              {percentageChangeDisplay}
            </Text>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

const cx = StyleSheet.create({
  bottom: {
    marginTop: 12,
  },
  container: {
    flexDirection: 'row',
    marginHorizontal: 19,
    marginVertical: 9.5,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
