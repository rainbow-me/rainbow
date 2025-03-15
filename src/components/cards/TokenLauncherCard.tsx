import React from 'react';
import { Text } from '@/design-system';
import { GenericCard } from './GenericCard';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';

export function TokenLauncherCard() {
  const { navigate } = useNavigation();
  return (
    <GenericCard
      onPress={() =>
        navigate(Routes.TOKEN_LAUNCHER_SCREEN, {
          gestureEnabled: false,
        })
      }
      testID="token-launcher-card"
      type="square"
    >
      <Text color="label" size="15pt" weight="bold">
        Token Launcher
      </Text>
    </GenericCard>
  );
}
