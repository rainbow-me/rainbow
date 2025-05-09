import React from 'react';
import isEqual from 'react-fast-compare';
import { Text as RNText, StyleSheet, View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../../../animations';
import { CoinRowHeight } from '../../../coin-row';
import { FloatingEmojis } from '../../../floating-emojis';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Text, TextIcon } from '@/design-system';
import { isNativeAsset } from '@/handlers/assets';
import { colors, fonts, fontWithWidth, getFontSize } from '@/styles';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { ChainId } from '@/state/backendNetworks/types';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';

const SafeRadialGradient = (IS_TEST ? View : RadialGradient) as typeof RadialGradient;

interface FastCurrencySelectionRowProps {
  item: any;
}

interface FavStarProps {
  theme: any;
  favorite: boolean;
  toggleFavorite: (onNewEmoji?: () => void) => void;
}

export function FavStar({ toggleFavorite, favorite, theme }: FavStarProps) {
  const { isDarkMode, colors } = theme;
  return (
    <ButtonPressAnimation onPress={toggleFavorite}>
      <SafeRadialGradient
        center={[0, 15]}
        colors={
          favorite
            ? [colors.alpha('#FFB200', isDarkMode ? 0.15 : 0), colors.alpha('#FFB200', isDarkMode ? 0.05 : 0.2)]
            : colors.gradients.lightestGrey
        }
        style={[sx.actionIconContainer, sx.starIcon]}
      >
        <TextIcon
          color={{ custom: favorite ? colors.yellowFavorite : colors.alpha(colors.blueGreyDark, 0.2) }}
          size="icon 13px"
          weight="bold"
        >
          {'􀋃'}
        </TextIcon>
      </SafeRadialGradient>
    </ButtonPressAnimation>
  );
}

interface InfoProps {
  contextMenuProps: any;
  showFavoriteButton: boolean;
  theme: any;
}

export function Info({ contextMenuProps, showFavoriteButton, theme }: InfoProps) {
  const { colors } = theme;
  return (
    <ContextMenuButton onPressMenuItem={contextMenuProps.handlePressMenuItem} {...contextMenuProps} style={showFavoriteButton && sx.info}>
      <ButtonPressAnimation>
        <SafeRadialGradient center={[0, 15]} colors={colors.gradients.lightestGrey} style={[sx.actionIconContainer, sx.infoIcon]}>
          <TextIcon color={{ custom: colors.alpha(colors.blueGreyDark, 0.3) }} size="icon 16px" weight="bold">
            {'􀅳'}
          </TextIcon>
        </SafeRadialGradient>
      </ButtonPressAnimation>
    </ContextMenuButton>
  );
}

export default React.memo(function FastCurrencySelectionRow({
  item: {
    colors,
    icon_url,
    native,
    balance,
    showBalance,
    showFavoriteButton,
    onPress,
    theme,
    nativeCurrencySymbol,
    favorite,
    toggleFavorite,
    contextMenuProps,
    symbol,
    address,
    name,
    testID,
    chainId,
    disabled,
  },
}: FastCurrencySelectionRowProps) {
  const { colors: themeColors } = theme;
  const rowTestID = `${testID}-exchange-coin-row-${symbol ?? ''}-${chainId || ChainId.mainnet}`;
  const isInfoButtonVisible = !isNativeAsset(address, chainId) && !showBalance;

  const canShowFavoriteButton = showFavoriteButton && chainId === ChainId.mainnet;

  return (
    <View style={sx.row} testID={rowTestID}>
      <ButtonPressAnimation onPress={onPress} style={[sx.flex, disabled && { opacity: 0.5 }]} wrapperStyle={sx.flex} disabled={disabled}>
        <View style={sx.rootContainer}>
          <View style={sx.iconContainer}>
            <RainbowCoinIcon
              chainId={chainId}
              color={colors?.primary || colors?.fallback || undefined}
              icon={icon_url || ''}
              symbol={symbol}
            />
          </View>
          <View style={sx.innerContainer}>
            <View
              style={[
                sx.column,
                sx.flex,
                {
                  justifyContent: showBalance ? 'center' : 'space-between',
                },
              ]}
            >
              <RNText
                ellipsizeMode="tail"
                numberOfLines={1}
                style={[sx.name, { color: themeColors.dark }, showBalance && sx.nameWithBalances]}
              >
                {name}
              </RNText>
              {!showBalance && (
                <RNText
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={[
                    sx.symbol,
                    {
                      color: theme.colors.blueGreyDark50,
                    },
                  ]}
                >
                  {symbol}
                </RNText>
              )}
            </View>
            {showBalance && (
              <View style={[sx.column, sx.balanceColumn]}>
                <Text align="right" color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="medium">
                  {native?.balance?.display ?? `${nativeCurrencySymbol}0.00`}
                </Text>
                <Text align="right" color={{ custom: theme.colors.blueGreyDark50 }} size="14px / 19px (Deprecated)" weight="medium">
                  {balance?.display ?? ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ButtonPressAnimation>
      {!showBalance && (
        <View style={sx.fav}>
          {isInfoButtonVisible && <Info contextMenuProps={contextMenuProps} showFavoriteButton={canShowFavoriteButton} theme={theme} />}
          {canShowFavoriteButton &&
            (IS_IOS ? (
              <FloatingEmojis
                centerVertically
                disableHorizontalMovement
                disableVerticalMovement
                distance={70}
                duration={400}
                emojis={['glowing_star']}
                fadeOut={false}
                marginTop={-4}
                range={[0, 0]}
                scaleTo={0}
                size={32}
                wiggleFactor={0}
              >
                {({ onNewEmoji }: { onNewEmoji: () => void }) => (
                  <FavStar favorite={favorite} theme={theme} toggleFavorite={() => toggleFavorite(onNewEmoji)} />
                )}
              </FloatingEmojis>
            ) : (
              <FavStar favorite={favorite} theme={theme} toggleFavorite={toggleFavorite} />
            ))}
        </View>
      )}
    </View>
  );
}, isEqual);

const sx = StyleSheet.create({
  addGradient: {
    paddingBottom: 3,
    paddingLeft: 1,
  },
  iconContainer: {
    elevation: 6,
    height: 59,
    overflow: 'visible',
    paddingTop: 9,
  },
  addText: {
    fontSize: 26,
    letterSpacing: 0,
    textAlign: 'center',
    ...fontWithWidth(fonts.weight.medium),
    height: 31,
    lineHeight: 30,
    width: '100%',
  },
  balanceColumn: {
    height: 34,
  },
  column: {
    flexDirection: 'column',
    height: 33,
    justifyContent: 'space-between',
  },
  fav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 17.5,
    width: 92,
  },
  flex: {
    flex: 1,
  },
  actionIconContainer: {
    height: 30,
    width: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  infoIcon: {
    paddingTop: IS_ANDROID ? 2 : 1,
    paddingLeft: StyleSheet.hairlineWidth * 2,
  },
  info: {
    paddingRight: 4,
  },
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
    width: '100%',
  },
  name: {
    fontSize: getFontSize(fonts.size.lmedium),
    letterSpacing: 0.5,
    lineHeight: IS_IOS ? 16 : 17,
    ...fontWithWidth(fonts.weight.semibold),
  },
  nameWithBalances: {
    lineHeight: 18.5,
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
    fontSize: 13,
    ...fontWithWidth(fonts.weight.regular),
  },
  starFavorite: {
    color: colors.yellowFavorite,
  },
  starIcon: {
    paddingTop: IS_IOS ? 1 : 3,
    paddingLeft: StyleSheet.hairlineWidth * 2,
  },
  symbol: {
    fontSize: getFontSize(fonts.size.smedium),
    letterSpacing: 0.5,
    lineHeight: IS_IOS ? 13.5 : 16,
    paddingTop: 5.5,
    ...fontWithWidth(fonts.weight.medium),
  },
});
