import React from 'react';
import { useColorMode } from '../color/ColorMode';
import { Box } from '../components/Box/Box';
import { Inset } from '../components/Inset/Inset';
import { Stack } from '../components/Stack/Stack';
import { Text } from '../components/Text/Text';

export function BackgroundDemo() {
  const { backgroundColors } = useColorMode();

  return (
    <Box background="surfacePrimary">
      {(Object.keys(backgroundColors) as (keyof typeof backgroundColors)[]).map(color => (
        <Box background={color} key={color}>
          <Inset space="20px">
            <Stack space="10px">
              <Text color="label" size="17pt" weight="bold">
                {color}
              </Text>
              <Text color="labelSecondary" size="17pt" weight="bold">
                {color}
              </Text>
            </Stack>
          </Inset>
        </Box>
      ))}
    </Box>
  );
}
