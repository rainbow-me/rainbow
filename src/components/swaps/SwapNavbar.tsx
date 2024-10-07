import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated';

import { THICK_BORDER_WIDTH } from '@/components/swaps/constants';
import { NavigationSteps, useSwapContext } from '@/components/swaps/providers/SwapProvider';
import { opacity } from '@/components/swaps/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Navbar } from '@/components/navbar/Navbar';
import { DEGEN_MODE, useExperimentalFlag } from '@/config';
import {
  AnimatedText,
  Bleed,
  Box,
  IconContainer,
  Inset,
  Text,
  TextShadow,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useAccountProfile } from '@/hooks';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { safeAreaInsetValues } from '@/utils';
import { GestureHandlerButton } from './GestureHandlerButton';

const SWAP_TITLE_LABEL = i18n.t(i18n.l.swap.modal_types.swap);
const BRIDGE_TITLE_LABEL = i18n.t(i18n.l.swap.modal_types.bridge);

function SwapSettings() {
  const { SwapNavigation, configProgress } = useSwapContext();

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const { isDarkMode } = useColorMode();

  const remoteConfig = useRemoteConfig();
  const degenModeEnabled = useExperimentalFlag(DEGEN_MODE) || remoteConfig.degen_mode;

  if (!degenModeEnabled) return null;

  return (
    <Bleed space="10px">
      <GestureHandlerButton
        onPressWorklet={() => {
          'worklet';
          if (configProgress.value !== NavigationSteps.SHOW_SETTINGS) {
            SwapNavigation.handleShowSettings();
          } else {
            SwapNavigation.handleDismissSettings();
          }
        }}
        scaleTo={0.8}
        style={{ padding: 10 }}
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
              <TextShadow blur={6} color={globalColors.grey100} shadowOpacity={0.2} y={2}>
                <Text align="center" color={isDarkMode ? 'label' : 'labelSecondary'} size="icon 17px" weight="regular">
                  􀜊
                </Text>
              </TextShadow>
            </Bleed>
          </IconContainer>
        </Box>
      </GestureHandlerButton>
    </Bleed>
  );
}

export function SwapNavbar() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();
  const { isDarkMode } = useColorMode();
  const { navigate, goBack } = useNavigation();

  const { AnimatedSwapStyles, swapInfo } = useSwapContext();

  const swapOrBridgeLabel = useDerivedValue(() => {
    return swapInfo.value.isBridging ? BRIDGE_TITLE_LABEL : SWAP_TITLE_LABEL;
  });

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
          <Bleed space="10px">
            <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8} style={{ padding: 10 }}>
              {accountImage ? (
                <ImageAvatar image={accountImage} marginRight={10} size="header" />
              ) : (
                <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
              )}
            </ButtonPressAnimation>
          </Bleed>
        }
        rightComponent={<SwapSettings />}
        titleComponent={
          <Inset bottom={{ custom: IS_IOS ? 5.5 : 14 }}>
            <AnimatedText align="center" color="label" size="20pt" weight="heavy">
              {swapOrBridgeLabel}
            </AnimatedText>
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
});
