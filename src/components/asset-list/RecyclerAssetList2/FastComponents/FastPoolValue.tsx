import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@rainbow-me/design-system';
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const MemoFastPoolValue = React.memo(function FastPoolValue({
  type,
  value,
  theme,
  nativeCurrency,
}: {
  nativeCurrency: keyof typeof supportedNativeCurrencies;
  type: string;
  value: number;
  theme: any;
}) {
  const { colors } = theme;
  const { color, formattedValue } = useMemo(() => {
    let formattedValue: number | string = value;
    let color =
      type === 'oneDayVolumeUSD' ? colors.swapPurple : colors.appleBlue;

    if (type === 'annualized_fees' || type === 'profit30d') {
      let percent: number = value;
      if (!percent || percent === 0) {
        formattedValue = '0%';
      }

      if (percent < 0.0001 && percent > 0) {
        formattedValue = '< 0.0001%';
      }

      if (percent < 0 && percent > -0.0001) {
        formattedValue = '< 0.0001%';
      }

      let fixedPercent = percent.toFixed(2);
      if (fixedPercent === '0.00') {
        formattedValue = '0%';
      }
      if (percent > 0) {
        color = colors.green;
        if (percent > 100) {
          formattedValue = `+${percent
            ?.toFixed(2)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`;
        } else {
          formattedValue = `+${fixedPercent}%`;
        }
      } else {
        formattedValue = `${fixedPercent}%`;
        color = colors.red;
      }
    } else if (type === 'liquidity' || type === 'oneDayVolumeUSD') {
      formattedValue = bigNumberFormat(value, nativeCurrency, value >= 10000);
    }
    return { color, formattedValue };
  }, [colors, nativeCurrency, type, value]);

  return (
    <View
      style={[{ backgroundColor: colors.alpha(color, 0.06) }, sx.container]}
    >
      <Text align="center" color={{ custom: color }} size="16px" weight="bold">
        {formattedValue}
      </Text>
    </View>
  );
});

export default MemoFastPoolValue;

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 15,
    paddingBottom: 11,
    paddingHorizontal: 8,
    paddingTop: 9,
  },
});
