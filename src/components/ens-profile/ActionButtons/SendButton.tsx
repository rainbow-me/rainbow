import React, { useCallback } from 'react';
import GradientOutlineButton from '../GradientOutlineButton/GradientOutlineButton';
import { useTheme } from '@rainbow-me/context';
import { ColorModeProvider } from '@rainbow-me/design-system';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function SendButton({ ensName }: { ensName?: string }) {
  const { colors } = useTheme();

  const { navigate } = useNavigation();
  const handlePressSend = useCallback(async () => {
    if (isNativeStackAvailable || android) {
      navigate(Routes.SEND_FLOW, {
        params: {
          address: ensName,
        },
        screen: Routes.SEND_SHEET,
      });
    } else {
      navigate(Routes.SEND_FLOW, {
        address: ensName,
      });
    }
  }, [ensName, navigate]);

  return (
    <ColorModeProvider value="darkTinted">
      <GradientOutlineButton
        gradient={colors.gradients.blueToGreen}
        onPress={handlePressSend}
        variant="circular"
      >
        􀈠
      </GradientOutlineButton>
    </ColorModeProvider>
  );
}
