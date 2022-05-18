import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../../../animations';
import FastCoinIcon from './FastCoinIcon';
import { Text } from '@rainbow-me/design-system';
import { bigNumberFormat } from '@rainbow-me/helpers/bigNumberFormat';
import { useAccountSettings } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';

export const PoolValue = ({
  type,
  value,
  theme,
}: {
  type: string;
  value: number;
  theme: any;
}) => {
  let formattedValue: number | string = value;
  const { colors } = theme;
  let color = type === 'oneDayVolumeUSD' ? colors.swapPurple : colors.appleBlue;
  const { nativeCurrency } = useAccountSettings();

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
  return (
    <View
      style={[
        { backgroundColor: colors.alpha(color, 0.06) },
        {
          borderRadius: 15,
          height: 30,
          ...padding.object(2, 9, 0),
          justifyContent: 'center',
        },
      ]}
    >
      <Text color={{ custom: color }} size="16px" weight="bold">
        {formattedValue}
      </Text>
    </View>
  );
};

interface UniswapCoinRowItem {
  onPress: () => void;
  tokens: any[];
  theme: any;
  tokenNames: string;
  symbol: string;
  value: number;
  attribute: string;
}

export default React.memo(function UniswapCoinRow({
  item,
}: {
  item: UniswapCoinRowItem;
}) {
  return (
    <View style={[cx.rootContainer, cx.nonEditMode]}>
      <View style={cx.flex}>
        <ButtonPressAnimation
          onPress={item.onPress}
          scaleTo={0.96}
          testID="balance-coin-row"
        >
          <View style={[cx.container]}>
            <View
              style={{
                flexDirection: 'row-reverse',
                justifyContent: 'flex-end',
                width: 60,
              }}
            >
              <View style={{ transform: [{ translateX: -20 }] }}>
                <FastCoinIcon
                  address={item.tokens[1].address.toLowerCase()}
                  // assetType={item.type}
                  symbol={item.tokens[1].symbol}
                  theme={item.theme}
                />
              </View>

              <FastCoinIcon
                address={item.tokens[0].address.toLowerCase()}
                symbol={item.tokens[0].symbol}
                theme={item.theme}
              />
            </View>

            <View style={cx.innerContainer}>
              <View style={cx.row}>
                <Text
                  align="right"
                  numberOfLines={1}
                  size="16px"
                  weight="medium"
                >
                  {item.tokenNames}
                </Text>
              </View>
              <View style={[cx.row, cx.bottom]}>
                <Text
                  color={{ custom: item.theme.colors.blueGreyDark50 }}
                  size="14px"
                >
                  {item.symbol}
                </Text>
              </View>
            </View>
            <PoolValue
              theme={item.theme}
              type={item.attribute}
              value={item.value}
            />
          </View>
        </ButtonPressAnimation>
      </View>
    </View>
  );
});

const cx = StyleSheet.create({
  bottom: {
    marginTop: 12,
  },
  container: {
    flexDirection: 'row',
    marginLeft: 2,
    marginRight: 19,
    marginVertical: 9.5,
  },
  flex: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  nonEditMode: {
    paddingLeft: 19,
  },
  rootContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
