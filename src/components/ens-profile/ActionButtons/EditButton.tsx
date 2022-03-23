import { useNavigation } from '@react-navigation/core';
import React, { useCallback } from 'react';
import GradientOutlineButton from '../GradientOutlineButton/GradientOutlineButton';
import { useTheme } from '@rainbow-me/context';
import { ColorModeProvider } from '@rainbow-me/design-system';
import Routes from '@rainbow-me/routes';

export default function WatchButton({ ensName }: { ensName?: string }) {
  const { colors } = useTheme();
  const { navigate } = useNavigation();

  const handlePressEdit = useCallback(() => {
    navigate(Routes.REGISTER_ENS_NAVIGATOR, {
      ensName,
      mode: 'edit',
    });
  }, [ensName, navigate]);

  return (
    <ColorModeProvider value="darkTinted">
      <GradientOutlineButton
        gradient={colors.gradients.blueToGreen}
        onPress={handlePressEdit}
      >
        􀈎 Edit profile
      </GradientOutlineButton>
    </ColorModeProvider>
  );
}
