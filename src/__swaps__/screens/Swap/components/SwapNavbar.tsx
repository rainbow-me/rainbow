import c from 'chroma-js';
import React from 'react';
import { StyleSheet, Text as RNText, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Navbar } from '@/components/navbar/Navbar';
import { Bleed, Box, IconContainer, Inset, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { useAccountProfile } from '@/hooks';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { safeAreaInsetValues } from '@/utils';

import { ETH_COLOR, ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '../constants';
import { OUTPUT_COLOR } from '../dummyValues';

import { getHighContrastColor, opacity } from '../utils';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useSwapContext } from '../providers/swap-provider';

export function SwapNavbar() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();
  const { isDarkMode } = useColorMode();
  const { navigate, goBack } = useNavigation();

  const {
    solidColorCoinIcons,
    AnimatedSwapStyles,

    setBottomColor,
    setSolidColorCoinIcons,
    setTopColor,
  } = useSwapContext();

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  return (
    <Box
      as={Animated.View}
      pointerEvents="box-none"
      position="absolute"
      style={AnimatedSwapStyles.focusedSearchStyle}
      top={{ custom: 0 }}
      width="full"
    >
      {IS_ANDROID ? <Pressable onPress={goBack} style={[StyleSheet.absoluteFillObject]} /> : null}
      <Box
        borderRadius={5}
        height={{ custom: 5 }}
        marginBottom={{ custom: 4 }}
        style={{
          alignSelf: 'center',
          backgroundColor: isDarkMode ? globalColors.white50 : 'rgba(9, 17, 31, 0.28)',
        }}
        top={{ custom: safeAreaInsetValues.top + 6 }}
        width={{ custom: 36 }}
      />
      <Navbar
        hasStatusBarInset={IS_IOS}
        leftComponent={
          <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8}>
            {accountImage ? (
              <ImageAvatar image={accountImage} marginRight={10} size="header" />
            ) : (
              <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
            )}
          </ButtonPressAnimation>
        }
        rightComponent={
          // TODO: This is temporarily hooked up to shuffle input/output colors
          <ButtonPressAnimation
            onLongPress={() => {
              setBottomColor(OUTPUT_COLOR);
              setTopColor(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);

              if (solidColorCoinIcons) {
                setSolidColorCoinIcons(false);
              }
            }}
            onPress={() => {
              const randomBottomColor = c.random().hex();
              const randomTopColor = c.random().hex();

              setBottomColor(getHighContrastColor(randomBottomColor, isDarkMode));
              setTopColor(getHighContrastColor(randomTopColor, isDarkMode));

              if (!solidColorCoinIcons) {
                setSolidColorCoinIcons(true);
              }
            }}
            scaleTo={0.8}
          >
            <Box
              alignItems="center"
              justifyContent="center"
              style={[
                styles.headerButton,
                {
                  backgroundColor: isDarkMode ? separatorSecondary : opacity(separatorSecondary, 0.03),
                  borderColor: isDarkMode ? separatorTertiary : opacity(separatorTertiary, 0.01),
                },
              ]}
            >
              <IconContainer opacity={0.8} size={34}>
                <Bleed space={isDarkMode ? '12px' : undefined}>
                  <RNText style={isDarkMode ? styles.headerTextShadow : undefined}>
                    <Text
                      align="center"
                      color={isDarkMode ? 'label' : 'labelSecondary'}
                      size="icon 17px"
                      style={{ lineHeight: IS_IOS ? 33 : 17 }}
                      weight="regular"
                    >
                      􀣌
                    </Text>
                  </RNText>
                </Bleed>
              </IconContainer>
            </Box>
          </ButtonPressAnimation>
        }
        titleComponent={
          <Inset bottom={{ custom: IS_IOS ? 5.5 : 14 }}>
            <Text align="center" color="label" size="20pt" weight="heavy">
              {i18n.t(i18n.l.swap.modal_types.swap)}
            </Text>
          </Inset>
        }
      />
    </Box>
  );
}

export const styles = StyleSheet.create({
  headerButton: {
    borderRadius: 18,
    borderWidth: THICK_BORDER_WIDTH,
    height: 36,
    width: 36,
  },
  headerTextShadow: {
    padding: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
