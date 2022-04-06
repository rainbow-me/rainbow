import { useNavigation } from '@react-navigation/core';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import GradientOutlineButton from '../GradientOutlineButton/GradientOutlineButton';
import { useTheme } from '@rainbow-me/context';
import { ColorModeProvider } from '@rainbow-me/design-system';
import { useENSRegistration } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function WatchButton({ ensName }: { ensName?: string }) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const { startRegistration } = useENSRegistration();

  const handlePressEdit = useCallback(() => {
    if (ensName) {
      startRegistration(ensName, 'edit');
      navigate(Routes.REGISTER_ENS_NAVIGATOR, {
        ensName,
        mode: 'edit',
      });
    }
  }, [ensName, navigate, startRegistration]);

  return (
    <ColorModeProvider value="darkTinted">
      <GradientOutlineButton
        gradient={colors.gradients.blueToGreen}
        onPress={handlePressEdit}
      >
        􀈎 {lang.t(`profiles.actions.edit_profile`)}
      </GradientOutlineButton>
    </ColorModeProvider>
  );
}
