import { ButtonPressAnimation } from '@/components/animations';
import { AccentColorProvider, Box, Text, Rows } from '@/design-system';
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
        <Rows alignHorizontal="center">
          <Box
            background="accent"
            borderRadius={99}
            height="40px"
            width="1/2"
            paddingHorizontal="12px"
            alignItems="center"
            justifyContent="center"
          >
            <Text weight="semibold" size="15pt" color={{ custom: 'white' }}>
              {`􀎬 Discover Web3`}
            </Text>
          </Box>
        </Rows>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
};
