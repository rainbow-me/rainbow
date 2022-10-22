import React from 'react';
import { AccentColorProvider, Box, Text } from '@/design-system';

interface IconOrbProps {
  color: string;
  shadowColor?: 'accent' | 'shadow';
  textIcon?: string;
  children?: React.ReactNode;
}

const IconOrb = ({ color, textIcon, children, shadowColor }: IconOrbProps) => {
  const Icon = () => {
    return textIcon ? (
      <Text
        containsEmoji
        size="17pt"
        weight="bold"
        align="center"
        color="label"
      >
        {textIcon}
      </Text>
    ) : (
      <>{children}</>
    );
  };

  return (
    <AccentColorProvider color={color}>
      {shadowColor ? (
        <Box
          width={{ custom: 36 }}
          height={{ custom: 36 }}
          borderRadius={18}
          background="accent"
          alignItems="center"
          justifyContent="center"
          shadow={shadowColor === 'accent' ? '18px accent' : '18px'}
        >
          <Icon />
        </Box>
      ) : (
        <Box
          width={{ custom: 36 }}
          height={{ custom: 36 }}
          borderRadius={18}
          background="accent"
          alignItems="center"
          justifyContent="center"
        >
          <Icon />
        </Box>
      )}
    </AccentColorProvider>
  );
};

export default IconOrb;
