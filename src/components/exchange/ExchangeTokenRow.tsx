import React from 'react';
import isEqual from 'react-fast-compare';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import RadialGradient from 'react-native-radial-gradient';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Box, Inline, Stack, Text } from '@/design-system';
import { isNativeAsset } from '@/handlers/assets';
import { Network } from '@/helpers';
import { useAccountAsset } from '@/hooks';
import { deviceUtils, ethereumUtils } from '@/utils';
import FastCoinIcon from '../asset-list/RecyclerAssetList2/FastComponents/FastCoinIcon';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { IS_IOS } from '@/env';

const SafeRadialGradient = (IS_TESTING === 'true'
  ? Box
  : RadialGradient) as typeof RadialGradient;

interface FastCurrencySelectionRowProps {
  item: any;
}

interface FavStarProps {
  theme: any;
  favorite: boolean;
  toggleFavorite: (onNewEmoji?: () => void) => void;
}

function FavStar({ toggleFavorite, favorite, theme }: FavStarProps) {
  const { isDarkMode, colors } = theme;
  return (
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
        style={{
          alignItems: 'center',
          borderRadius: 15,
          height: 30,
          width: 30,
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Text
          size="15pt"
          numberOfLines={1}
          color={favorite ? 'yellow' : 'secondary25 (Deprecated)'}
        >
          􀋃
        </Text>
      </SafeRadialGradient>
    </ButtonPressAnimation>
  );
}

const deviceWidth = deviceUtils.dimensions.width;

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
    mainnet_address,
    name,
    testID,
    type,
    disabled,
  },
}: FastCurrencySelectionRowProps) {
  const { colors } = theme;

  // TODO https://github.com/rainbow-me/rainbow/pull/3313/files#r876259954
  const item = useAccountAsset(uniqueId, nativeCurrency);
  const network = ethereumUtils.getNetworkFromType(type) ?? Network.mainnet;
  const rowTestID = `${testID}-exchange-coin-row-${
    symbol ?? item?.symbol ?? ''
  }-${type || 'token'}`;

  const isInfoButtonVisible =
    !item?.isNativeAsset ||
    (!isNativeAsset(address ?? item?.address, network) && !showBalance);

  return (
    <Box height="56px" paddingHorizontal="20px">
      <Box
        as={ButtonPressAnimation}
        // @ts-ignore
        onPress={onPress}
        style={[disabled && { opacity: 0.5 }]}
        testID={rowTestID}
        disabled={disabled}
      >
        <Inline alignVertical="center" space="10px" alignHorizontal="justify">
          <Inline alignVertical="center" space="10px">
            <Box
              as={FastCoinIcon}
              address={address || item?.address}
              assetType={type ?? item?.type}
              mainnetAddress={mainnet_address ?? item?.mainnet_address}
              symbol={symbol ?? item?.symbol}
              theme={theme}
            />
            <Stack space="10px">
              <Text
                size="15px / 21px (Deprecated)"
                color="primary (Deprecated)"
                weight="bold"
                numberOfLines={1}
              >
                {name ?? item?.name}
              </Text>
              {item?.balance?.display && (
                <Text
                  size="13pt"
                  color="secondary (Deprecated)"
                  numberOfLines={1}
                >
                  {item?.balance?.display ?? ''}
                </Text>
              )}
            </Stack>
          </Inline>

          {showBalance && (
            <Box background="fillSecondary" padding="8px" borderRadius={15}>
              <Text
                align="right"
                size="15px / 21px (Deprecated)"
                weight="bold"
                color="labelSecondary"
              >
                {item?.native?.balance?.display ??
                  `${nativeCurrencySymbol}0.00`}
              </Text>
            </Box>
          )}
          {!showBalance && (
            <Box>
              <Inline alignVertical="center" space="12px">
                {isInfoButtonVisible && (
                  <ContextMenuButton
                    onPressMenuItem={contextMenuProps.handlePressMenuItem}
                    {...contextMenuProps}
                    style={showFavoriteButton || showAddButton}
                  >
                    <ButtonPressAnimation>
                      <SafeRadialGradient
                        center={[0, 15]}
                        colors={colors.gradients.lightestGrey}
                        style={{
                          alignItems: 'center',
                          borderRadius: 15,
                          height: 30,
                          width: 30,
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <Text
                          color="secondary25 (Deprecated)"
                          size="14px / 19px (Deprecated)"
                          weight="bold"
                        >
                          􀅳
                        </Text>
                      </SafeRadialGradient>
                    </ButtonPressAnimation>
                  </ContextMenuButton>
                )}
                {showFavoriteButton &&
                  (IS_IOS ? (
                    // @ts-ignore
                    <FloatingEmojis
                      centerVertically
                      deviceWidth={deviceWidth}
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
                        <FavStar
                          favorite={favorite}
                          theme={theme}
                          toggleFavorite={() => toggleFavorite(onNewEmoji)}
                        />
                      )}
                    </FloatingEmojis>
                  ) : (
                    <FavStar
                      favorite={favorite}
                      theme={theme}
                      toggleFavorite={toggleFavorite}
                    />
                  ))}
              </Inline>
            </Box>
          )}
        </Inline>
      </Box>
    </Box>
  );
},
isEqual);
