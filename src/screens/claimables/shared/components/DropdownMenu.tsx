import { Box, Text, useColorMode } from '@/design-system';
import React from 'react';
import { DropdownMenu as GenericDropdownMenu, MenuConfig } from '@/components/DropdownMenu';
import { ButtonPressAnimation } from '@/components/animations';

export function DropdownMenu({
  menuConfig,
  muted,
  onPressMenuItem,
  text,
}: {
  menuConfig: MenuConfig<string>;
  muted: boolean;
  onPressMenuItem: (actionKey: string) => void;
  text: string;
}) {
  const { isDarkMode } = useColorMode();

  return (
    <GenericDropdownMenu menuConfig={menuConfig} onPressMenuItem={onPressMenuItem}>
      <ButtonPressAnimation>
        <Box
          paddingHorizontal={{ custom: 7 }}
          height={{ custom: 28 }}
          flexDirection="row"
          borderColor={{ custom: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.02)' }}
          borderWidth={1.33}
          borderRadius={12}
          gap={4}
          style={{ backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.02)' }}
          alignItems="center"
          justifyContent="center"
        >
          <Text align="center" weight="heavy" color={muted ? 'labelQuaternary' : 'label'} size="17pt">
            {text ?? 'a token'}
          </Text>
          <Text align="center" weight="heavy" color="labelSecondary" size="icon 12px">
            􀆏
          </Text>
        </Box>
      </ButtonPressAnimation>
    </GenericDropdownMenu>
  );
}
