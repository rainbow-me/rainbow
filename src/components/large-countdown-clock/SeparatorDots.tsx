import React from 'react';
import { Box, useForegroundColor } from '@/design-system';

type SeparatorDotsProps = {
  minuteEndsWithOne: boolean;
  size: number;
};

export function SeparatorDots({ size, minuteEndsWithOne }: SeparatorDotsProps) {
  const accentColor = useForegroundColor('accent');
  return (
    <Box
      alignItems="center"
      flexDirection="column"
      justifyContent="center"
      paddingBottom={{ custom: 2 }}
      paddingLeft={{ custom: minuteEndsWithOne ? 0 : 3 }}
      paddingRight={{ custom: 3 }}
      style={{
        marginLeft: minuteEndsWithOne ? -1 : 0,
      }}
    >
      <Box
        borderRadius={200}
        height={{ custom: size }}
        marginBottom={{ custom: size / 2 }}
        marginTop={{ custom: size / 2 }}
        style={{
          backgroundColor: accentColor,
        }}
        width={{ custom: size }}
      />
      <Box
        borderRadius={200}
        height={{ custom: size }}
        marginBottom={{ custom: size / 2 }}
        marginTop={{ custom: size / 2 }}
        style={{
          backgroundColor: accentColor,
        }}
        width={{ custom: size }}
      />
    </Box>
  );
}
