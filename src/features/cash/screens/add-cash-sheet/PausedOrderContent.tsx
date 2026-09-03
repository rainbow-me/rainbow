import React, { useCallback } from 'react';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';
import { CashActionButton } from '@/features/cash/components/CashActionButton';
import * as i18n from '@/languages';
import { RAINBOW_SUPPORT_URL } from '@/references/constants';
import { openInBrowser } from '@/utils/openInBrowser';

import { AccountAvatar } from './AccountAvatar';
import { SettingsButton } from './SettingsButton';

const l = i18n.l.cash.add_cash_screen;

const WARNING_ICON = '􀇾';

export function PausedOrderContent({ onCheckAgain, onSettings }: { onCheckAgain: () => void; onSettings: () => void }) {
  const handleContactSupport = useCallback(() => {
    openInBrowser(RAINBOW_SUPPORT_URL);
  }, []);

  return (
    <Box as={Animated.View} entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)}>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="24px" paddingTop="28px">
        <AccountAvatar />
        <SettingsButton onPress={onSettings} />
      </Box>
      <Box gap={24} paddingHorizontal="32px" paddingTop="44px">
        <Text color="orange" size="44pt" weight="heavy">
          {WARNING_ICON}
        </Text>
        <Text color="label" size="26pt" weight="heavy">
          {i18n.t(l.paused_title)}
        </Text>
        <Text color="labelQuaternary" size="17pt" weight="bold">
          {i18n.t(l.paused_description)}
        </Text>
      </Box>
      <Box gap={24} paddingBottom="16px" paddingHorizontal="20px" paddingTop="44px">
        <CashActionButton label={i18n.t(l.check_again)} onPress={onCheckAgain} testID="cash-deposit-add-cash-check-again" />
        <ButtonPressAnimation onPress={handleContactSupport} scaleTo={0.92} testID="cash-deposit-add-cash-contact-support">
          <Text align="center" color="blue" size="17pt" weight="heavy">
            {i18n.t(l.contact_support)}
          </Text>
        </ButtonPressAnimation>
      </Box>
    </Box>
  );
}
