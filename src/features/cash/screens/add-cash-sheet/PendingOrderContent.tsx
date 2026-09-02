import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import * as i18n from '@/languages';
import { RAINBOW_SUPPORT_URL } from '@/references/constants';
import { openInBrowser } from '@/utils/openInBrowser';

import { AccountAvatar } from './AccountAvatar';
import { SettingsButton } from './SettingsButton';

export function PendingOrderContent({ onSettings }: { onSettings: () => void }) {
  const blue = useForegroundColor('blue');

  const handleContactSupport = useCallback(() => {
    openInBrowser(RAINBOW_SUPPORT_URL);
  }, []);

  return (
    <Box as={Animated.View} entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="24px" paddingTop="28px">
        <AccountAvatar />
        <SettingsButton onPress={onSettings} />
      </Box>
      <Box alignItems="center" gap={23} paddingHorizontal={{ custom: 40 }} paddingTop="44px">
        <Box alignItems="center" height={{ custom: 64 }} justifyContent="center" width={{ custom: 64 }}>
          <AnimatedSpinner color={blue} isLoading size={60} />
          <Box
            alignItems="center"
            justifyContent="center"
            style={[styles.icon, { backgroundColor: blue, borderColor: opacity(blue, 0.4), shadowColor: blue }]}
          >
            <Text align="center" color="white" size="26pt" style={styles.iconGlyph} weight="black">
              {'$'}
            </Text>
          </Box>
        </Box>
        <Box alignItems="center" gap={20}>
          <Text align="center" color="label" size="26pt" weight="heavy">
            {i18n.t(i18n.l.cash.add_cash_screen.pending_title)}
          </Text>
          <Text align="center" color="labelQuaternary" size="17pt" weight="bold">
            {i18n.t(i18n.l.cash.add_cash_screen.pending_description)}
          </Text>
        </Box>
      </Box>
      <Box alignItems="center" paddingBottom="44px" paddingTop="44px">
        <ButtonPressAnimation onPress={handleContactSupport} scaleTo={0.92} testID="cash-deposit-add-cash-contact-support">
          <Text align="center" color="blue" size="17pt" weight="heavy">
            {i18n.t(i18n.l.cash.add_cash_screen.contact_support)}
          </Text>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  icon: {
    borderRadius: 26,
    borderWidth: 1.33,
    height: 52,
    left: 6,
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    top: 6,
    width: 52,
  },
  iconGlyph: {
    transform: [{ rotate: '-4.7deg' }],
  },
});
