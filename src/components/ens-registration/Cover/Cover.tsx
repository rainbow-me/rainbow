import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import RadialGradient from 'react-native-radial-gradient';
import { useTheme } from '@rainbow-me/context';
import { Box, Text, useForegroundColor } from '@rainbow-me/design-system';

const alpha = '33';

export default function Cover() {
  const { colors } = useTheme();
  const accentColor = useForegroundColor('accent');

  const handleChooseCover = useCallback(() => {
    // TODO
  }, []);

  return (
    <ContextMenuButton
      enableContextMenu
      menuConfig={{
        menuItems: [
          {
            actionKey: 'a',
            actionTitle: 'Choose from Library',
            icon: {
              imageValue: {
                systemName: 'photo',
              },
              type: 'IMAGE_SYSTEM',
            },
          },
        ],
        menuTitle: '',
      }}
      {...(android ? { onPress: () => {} } : {})}
      isMenuPrimaryAction
      onPressMenuItem={handleChooseCover}
      useActionSheetFallback={false}
    >
      <Box
        alignItems="center"
        as={RadialGradient}
        colors={[colors.whiteLabel + alpha, accentColor + alpha]}
        height="126px"
        justifyContent="center"
        stops={[0.6, 0]}
      >
        <Text color="accent" size="18px" weight="heavy">
          􀣵 Add Cover
        </Text>
      </Box>
    </ContextMenuButton>
  );
}
