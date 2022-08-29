import React from 'react';
import { PressableProps } from 'react-native';
import { ButtonPressAnimation } from '../animations';
import { Box, Text } from '@/design-system';

type NavbarIconButtonProps = {
  icon: string;
  onPress: PressableProps['onPress'];
};

export function NavbarIconButton({ icon, onPress }: NavbarIconButtonProps) {
  return (
    <Box
      as={ButtonPressAnimation}
      // @ts-expect-error - JS component'
      onPress={onPress}
      scale={0.8}
    >
      <Text size="23px" weight="bold">
        {icon}
      </Text>
    </Box>
  );
}
