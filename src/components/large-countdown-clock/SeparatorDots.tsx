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
      paddingBottom={2}
      paddingLeft={minuteEndsWithOne ? 0 : 3}
      paddingRight={3}
      style={{
        marginLeft: minuteEndsWithOne ? -1 : 0,
      }}
    >
      <Box
        borderRadius={200}
        height={size}
        marginBottom={size / 2}
        marginTop={size / 2}
        style={{
          backgroundColor: accentColor,
        }}
        width={size}
      />
      <Box
        borderRadius={200}
        height={size}
        marginBottom={size / 2}
        marginTop={size / 2}
        style={{
          backgroundColor: accentColor,
        }}
        width={size}
      />
    </Box>
  );
}
