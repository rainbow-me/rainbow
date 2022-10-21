import { ButtonPressAnimation } from '@/components/animations';
import { AccentColorProvider, Box, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import React, { useCallback } from 'react';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';

export const DiscoverMoreButton = () => {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const { accentColor, loaded: accentColorLoaded } = useAccountAccentColor();

  const handlePressDiscover = useCallback(() => {
    navigate(Routes.DISCOVER_SCREEN);
  }, [navigate]);

  return (
    <ButtonPressAnimation onPress={handlePressDiscover}>
      <AccentColorProvider color={colors.alpha(accentColor, 0.6)}>
        <Box
          background="accent"
          borderRadius={99}
          height="40px"
          width="full"
          alignItems="center"
          justifyContent="center"
        >
          <Text weight="semibold" size="15pt" color="accent">
            {`Discover Web3`}
          </Text>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
};
