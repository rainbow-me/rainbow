import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../../../animations';
import FastCoinIcon from './FastCoinIcon';
import FastPoolValue from './FastPoolValue';
import { Text } from '@rainbow-me/design-system';

interface UniswapCoinRowItem {
  onPress: () => void;
  tokens: any[];
  theme: any;
  tokenNames: string;
  symbol: string;
  value: number;
  attribute: string;
  nativeCurrency: string;
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
