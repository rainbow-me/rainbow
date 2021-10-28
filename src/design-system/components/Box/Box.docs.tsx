/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { ColorModeProvider, useColorMode } from '../../color/ColorMode';
import { Docs } from '../../playground/Docs';
import { Columns } from '../Columns/Columns';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Box } from './Box';

function BackgroundDemo() {
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

const docs: Docs = {
  name: 'Box',
  category: 'Layout',
  examples: [
    {
      name: 'Backgrounds',
      example: (
        <Columns space="19px">
          <Stack space="10px">
            <Text weight="bold">Light mode</Text>
            <ColorModeProvider value="light">
              <BackgroundDemo />
            </ColorModeProvider>
          </Stack>
          <Stack space="10px">
            <Text weight="bold">Dark mode</Text>
            <ColorModeProvider value="dark">
              <BackgroundDemo />
            </ColorModeProvider>
          </Stack>
        </Columns>
      ),
    },
  ],
};

export default docs;
