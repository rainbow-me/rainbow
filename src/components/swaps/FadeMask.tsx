import React from 'react';
import { Box, Columns, Column, globalColors } from '@/design-system';
import LinearGradient from 'react-native-linear-gradient';

export const FadeMask = ({
  fadeEdgeInset = 6,
  fadeWidth = 14,
  height,
  side,
}: {
  fadeEdgeInset?: number;
  fadeWidth?: number;
  height?: number;
  side?: 'left' | 'right';
}) => {
  return (
    <Box height={height ? { custom: height } : 'full'} width="full">
      <Columns>
        {!side || side === 'left' ? (
          <>
            <Column width="content">
              <Box height="full" width={{ custom: fadeEdgeInset }} />
            </Column>
            <Column width="content">
              <Box
                as={LinearGradient}
                colors={['transparent', globalColors.grey100]}
                end={{ x: 1, y: 0.5 }}
                height="full"
                start={{ x: 0, y: 0.5 }}
                width={{ custom: fadeWidth }}
              />
            </Column>
          </>
        ) : null}
        <Column>
          <Box background="surfacePrimary" height="full" />
        </Column>
        {!side || side === 'right' ? (
          <>
            <Column width="content">
              <Box
                as={LinearGradient}
                colors={[globalColors.grey100, 'transparent']}
                end={{ x: 1, y: 0.5 }}
                height="full"
                start={{ x: 0, y: 0.5 }}
                width={{ custom: fadeWidth }}
              />
            </Column>
            <Column width="content">
              <Box height="full" width={{ custom: fadeEdgeInset }} />
            </Column>
          </>
        ) : null}
      </Columns>
    </Box>
  );
};
