import React, { ReactNode } from 'react';
import { TextColor } from '../../design-system/color/palettes';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { ButtonProps } from '../animations/ButtonPressAnimation/types';
import { AccentColorProvider, Box, Cover, Text, useForegroundColor } from '@/design-system';

const TintButton = ({
  children,
  disabled,
  onPress,
  color = 'secondary80 (Deprecated)',
  testID,
}: {
  children: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  color?: TextColor;
  testID?: string;
}) => {
  const secondary06 = useForegroundColor('secondary06 (Deprecated)');

  const height = 56;

  return (
    <Box
      alignItems="center"
      as={ButtonPressAnimation}
      height={`${height}px`}
      justifyContent="center"
      onPress={disabled ? () => undefined : onPress}
      scaleTo={disabled ? 1 : 0.9}
      style={{
        opacity: disabled ? 0.5 : 1,
        overflow: 'hidden',
      }}
      testID={testID}
    >
      <Cover>
        <AccentColorProvider color={secondary06}>
          <Box alignItems="center" background="accent" borderRadius={46} height={`${height}px`} justifyContent="center" width="full" />
        </AccentColorProvider>
      </Cover>
      <Text color={color} size="20px / 24px (Deprecated)" weight="heavy">
        {children}
      </Text>
    </Box>
  );
};

export default TintButton;
