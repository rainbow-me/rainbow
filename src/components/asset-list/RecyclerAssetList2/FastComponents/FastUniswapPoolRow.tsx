import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../../../animations';
import FastCoinIcon from './FastCoinIcon';
import FastPoolValue from './FastPoolValue';
import { Text } from '@/design-system';
import { UniswapPoolAddressDetailsFull } from '@/redux/uniswapLiquidity';
import { supportedNativeCurrencies } from '@/references';

interface UniswapCoinRowItem {
  onPress: () => void;
  tokens: UniswapPoolAddressDetailsFull[];
  theme: any;
  tokenNames: string;
  symbol: string;
  value: number;
  attribute: string;
  nativeCurrency: keyof typeof supportedNativeCurrencies;
}

export default React.memo(function UniswapCoinRow({
  item,
}: {
  item: UniswapCoinRowItem;
}) {
  return (
    <View style={[sx.rootContainer, sx.nonEditMode]}>
      <View style={sx.flex}>
        <ButtonPressAnimation
          onPress={item.onPress}
          scaleTo={0.96}
          testID="balance-coin-row"
        >
          <View style={sx.container}>
            <View style={sx.reverseRow}>
              <View style={sx.translateX}>
                <FastCoinIcon
                  address={item.tokens[1].address?.toLowerCase()!}
                  symbol={item.tokens[1].symbol}
                  theme={item.theme}
                />
              </View>
              <FastCoinIcon
                address={item.tokens[0].address?.toLowerCase()!}
                symbol={item.tokens[0].symbol}
                theme={item.theme}
              />
            </View>
            <View style={sx.innerContainer}>
              <View style={sx.row}>
                <Text
                  numberOfLines={1}
                  color="primary (Deprecated)"
                  size="16px / 22px (Deprecated)"
                  weight="semibold"
                >
                  {item.tokenNames}
                </Text>
              </View>
              <View style={[sx.row, sx.bottom]}>
                <Text
                  color={{ custom: item.theme.colors.blueGreyDark50 }}
                  size="14px / 19px (Deprecated)"
                  weight="medium"
                >
                  {item.symbol}
                </Text>
              </View>
            </View>
            <FastPoolValue
              nativeCurrency={item.nativeCurrency}
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

const sx = StyleSheet.create({
  bottom: {
    marginTop: 10,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 19,
  },
  flex: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    marginLeft: 10,
  },
  nonEditMode: {
    paddingLeft: 19,
  },
  reverseRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    width: 70,
  },
  rootContainer: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
  },
  translateX: {
    marginLeft: -10,
  },
});
