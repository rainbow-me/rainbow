import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Box, Cover, Inset, Text } from '@rainbow-me/design-system';

export default function GradientOutlineButton({
  gradient,
  children,
  variant,
}: {
  gradient: string[];
  children: string;
  variant?: 'circular';
}) {
  return (
    <Box
      alignItems="center"
      as={ButtonPressAnimation}
      height="40px"
      justifyContent="center"
      style={{
        overflow: 'hidden',
        ...(variant === 'circular' && {
          width: 40,
        }),
      }}
    >
      <Cover>
        <Box
          as={LinearGradient}
          borderRadius={23}
          colors={gradient}
          end={{ x: 1, y: 0 }}
          height="full"
          start={{ x: 0, y: 0 }}
          width="full"
        />
      </Cover>
      <Cover>
        <Box style={{ height: '100%', padding: 2, width: '100%' }}>
          <Box background="body" borderRadius={23} height="full" width="full" />
        </Box>
      </Cover>
      <Inset horizontal={variant !== 'circular' ? '15px' : undefined}>
        <Text size="16px" weight="heavy">
          {children}
        </Text>
      </Inset>
    </Box>
  );
}
