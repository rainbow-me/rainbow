import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../../../animations';
import { PoolValue } from '../../../investment-cards/PoolValue';
import FastCoinIcon from './FastCoinIcon';
import { Text } from '@rainbow-me/design-system';
import { borders, colors, padding } from '@rainbow-me/styles';

export default React.memo(function UniswapCoinRow({ item }: { item: any }) {
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
                // assetType={item.type}
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
            {/*TODO make fast*/}
            <PoolValue type={item.attribute} value={item[item.attribute]} />
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
  checkboxContainer: {
    width: 51,
  },
  checkboxInnerContainer: {
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    height: 40,
    justifyContent: 'center',
    width: 51,
  },
  checkmarkBackground: {
    ...borders.buildCircleAsObject(22),
    ...padding.object(4.5),
    backgroundColor: colors.appleBlue,
    left: 19,
    position: 'absolute',
  },
  circleOutline: {
    ...borders.buildCircleAsObject(22),
    borderWidth: 1.5,
    left: 19,
    position: 'absolute',
  },
  coinIconFallback: {
    backgroundColor: '#25292E',
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  coinIconIndicator: {
    left: 19,
    position: 'absolute',
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
  hiddenRow: {
    opacity: 0.4,
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
