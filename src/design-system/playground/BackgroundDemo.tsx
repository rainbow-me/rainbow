import React from 'react';
import { useColorMode } from '../color/ColorMode';
import { Box } from '../components/Box/Box';
import { Inset } from '../components/Inset/Inset';
import { Stack } from '../components/Stack/Stack';
import { Text } from '../components/Text/Text';

export function BackgroundDemo() {
  const { backgroundColors } = useColorMode();

  return (
    <>
      {(Object.keys(backgroundColors) as (keyof typeof backgroundColors)[])
        .sort()
        .map(color => (
          <Box background={color} key={color}>
            <Inset space="19px">
              <Stack space="10px">
                <Text color="primary" weight="bold">
                  {color}
                </Text>
                <Text color="secondary50" weight="bold">
                  {color}
                </Text>
              </Stack>
            </Inset>
          </Box>
        ))}
    </>
  );
}
