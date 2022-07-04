import React from 'react';
import { Text as RNText, StyleSheet, View } from 'react-native';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
// @ts-ignore
import { ContextMenuButton } from 'react-native-ios-context-menu';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../../../animations';
import { CoinRowHeight } from '../../../coin-row';
import FastCoinIcon from './FastCoinIcon';
import { Text } from '@rainbow-me/design-system';
import { useAccountAsset } from '@rainbow-me/hooks';
import {
  borders,
  colors,
  fonts,
  fontWithWidth,
  getFontSize,
  padding,
} from '@rainbow-me/styles';
import { isETH } from '@rainbow-me/utils';

const SafeRadialGradient = (IS_TESTING === 'true'
  ? View
  : RadialGradient) as typeof RadialGradient;

export default React.memo(function FastCurrencySelectionRow({
  item: {
    uniqueId,
    showBalance,
    showFavoriteButton,
    showAddButton,
    onPress,
    theme,
    nativeCurrency,
    nativeCurrencySymbol,
    favorite,
    toggleFavorite,
    contextMenuProps,
    symbol,
    address,
    name,
    testID,
  },
}: {
  item: any;
}) {
  const { isDarkMode } = theme;

  // TODO https://github.com/rainbow-me/rainbow/pull/3313/files#r876259954
  const item = useAccountAsset(uniqueId, nativeCurrency);

  const rowTestID = testID + '-exchange-coin-row-' + (item?.symbol || symbol);

  return (
    <View style={cx.row}>
      <ButtonPressAnimation
        onPress={onPress}
        style={cx.flex}
        testID={rowTestID}
        wrapperStyle={cx.flex}
      >
        <View style={cx.rootContainer}>
          <FastCoinIcon
            address={item?.mainnet_address || item?.address || address}
            symbol={item?.symbol || symbol}
            theme={theme}
          />
          <View style={cx.innerContainer}>
            <View
              style={[
                cx.column,
                {
                  justifyContent: showBalance ? 'center' : 'space-between',
                },
              ]}
            >
              <RNText
                ellipsizeMode="tail"
                numberOfLines={1}
                style={[cx.name, showBalance && cx.nameWithBalances]}
              >
                {item?.name || name}
              </RNText>
              {!showBalance && (
                <>
                  <RNText
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={[
                      cx.symbol,
                      {
                        color: theme.colors.blueGreyDark50,
                      },
                    ]}
                  >
                    {item?.symbol || symbol}
                  </RNText>
                </>
              )}
            </View>
            {showBalance && (
              <View style={[cx.column, { height: 34 }]}>
                <Text align="right" size="16px">
                  {item?.native?.balance?.display ??
                    `${nativeCurrencySymbol}0.00`}
                </Text>
                <Text
                  align="right"
                  color={{ custom: theme.colors.blueGreyDark50 }}
                  size="14px"
                >
                  {item?.balance?.display ?? ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ButtonPressAnimation>
      {!showBalance && (
        <View style={[cx.fav]}>
          {(!item?.isNativeAsset || isETH(item?.address)) && !showBalance && (
            <ContextMenuButton
              activeOpacity={0}
              isMenuPrimaryAction
              useActionSheetFallback={false}
              wrapNativeComponent={false}
              {...contextMenuProps}
            >
              <ButtonPressAnimation>
                <SafeRadialGradient
                  center={[0, 15]}
                  colors={colors.gradients.lightestGrey}
                  style={[cx.gradient, cx.igradient]}
                >
                  <Text
                    color={{ custom: colors.alpha(colors.blueGreyDark, 0.3) }}
                    weight="bold"
                  >
                    􀅳
                  </Text>
                </SafeRadialGradient>
              </ButtonPressAnimation>
            </ContextMenuButton>
          )}
          {showFavoriteButton && (
            <ButtonPressAnimation onPress={toggleFavorite}>
              <SafeRadialGradient
                center={[0, 15]}
                colors={
                  favorite
                    ? [
                        colors.alpha('#FFB200', isDarkMode ? 0.15 : 0),
                        colors.alpha('#FFB200', isDarkMode ? 0.05 : 0.2),
                      ]
                    : colors.gradients.lightestGrey
                }
                style={[cx.gradient, cx.starGradient]}
              >
                <RNText
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={[cx.star, favorite && cx.starFavorite]}
                >
                  􀋃
                </RNText>
              </SafeRadialGradient>
            </ButtonPressAnimation>
          )}
          {showAddButton && (
            <ButtonPressAnimation onPress={toggleFavorite}>
              <SafeRadialGradient
                center={[0, 15]}
                colors={colors.gradients.lightestGrey}
                style={[cx.gradient, cx.addGradient]}
              >
                <RNText style={cx.addText}>+</RNText>
              </SafeRadialGradient>
            </ButtonPressAnimation>
          )}
        </View>
      )}
    </View>
  );
});

const cx = StyleSheet.create({
  addGradient: {
    paddingBottom: 3,
    paddingLeft: 1,
  },
  addText: {
    color: colors.alpha(colors.blueGreyDark, 0.3),
    fontSize: 26,
    letterSpacing: 0,
    textAlign: 'center',
    ...fontWithWidth(fonts.weight.medium),
    height: 31,
    lineHeight: 30,
    width: '100%',
  },
  bottom: {
    marginTop: 12,
  },
  center: {
    justifyContent: 'center',
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
  column: {
    flexDirection: 'column',
    height: 33,
    justifyContent: 'space-between',
  },
  container: {
    flexDirection: 'row',
    marginLeft: 2,
    marginRight: 19,
    marginVertical: 9.5,
  },
  fav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 17.5,
    width: 92,
  },
  flex: {
    flex: 1,
  },
  gradient: {
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 2,
    overflow: 'hidden',
    width: 30,
  },
  hiddenRow: {
    opacity: 0.4,
  },
  igradient: {
    paddingBottom: ios ? 0 : 2.5,
    paddingLeft: 2.5,
    paddingTop: ios ? 1 : 0,
  },
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
    width: '100%',
  },
  name: {
    color: colors.dark,
    fontSize: getFontSize(fonts.size.lmedium),
    letterSpacing: 0.5,
    lineHeight: ios ? 16 : 17,
    ...fontWithWidth(fonts.weight.regular),
  },
  nameWithBalances: {
    lineHeight: 18.5,
  },
  nonEditMode: {
    paddingHorizontal: 19,
  },
  rootContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: CoinRowHeight,
    paddingHorizontal: 19,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  star: {
    color: colors.alpha(colors.blueGreyDark, 0.2),
    fontSize: 13,
    ...fontWithWidth(fonts.weight.regular),
  },
  starFavorite: {
    color: colors.yellowFavorite,
  },
  starGradient: {
    paddingBottom: ios ? 3 : 5,
    paddingLeft: ios ? 1 : 0,
    paddingTop: 3,
    width: 30,
  },
  symbol: {
    fontSize: getFontSize(fonts.size.smedium),
    letterSpacing: 0.5,
    lineHeight: ios ? 13.5 : 16,
    paddingTop: 5.5,
    ...fontWithWidth(fonts.weight.regular),
  },
});
