import React from 'react';

import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Column, Columns } from '../Columns/Columns';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Box } from './Box';

export const background: Example = {
  name: 'Background',
  Example: () =>
    source(
      <>
        <Box background="surface" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            surface
          </Text>
        </Box>
        <Box background="surfaceSecondary" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            surfaceSecondary
          </Text>
        </Box>
        <Box background="surfaceTertiary" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            surfaceTertiary
          </Text>
        </Box>
        <Box background="fill" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            fill
          </Text>
        </Box>
        <Box background="fillSecondary" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            fillSecondary
          </Text>
        </Box>
        <Box background="fillTertiary" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            fillTertiary
          </Text>
        </Box>
        <Box background="accent" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            accent
          </Text>
        </Box>
        <Box background="blue" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            blue
          </Text>
        </Box>
        <Box background="green" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            green
          </Text>
        </Box>
        <Box background="red" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            red
          </Text>
        </Box>
        <Box background="purple" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            purple
          </Text>
        </Box>
        <Box background="pink" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            pink
          </Text>
        </Box>
        <Box background="orange" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            orange
          </Text>
        </Box>
        <Box background="yellow" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            yellow
          </Text>
        </Box>
        <Box background="body (Deprecated)" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            body (Deprecated)
          </Text>
        </Box>
        <Box background="action (Deprecated)" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            action (Deprecated)
          </Text>
        </Box>
        <Box background="swap (Deprecated)" padding="19px">
          <Text color="label" size="17pt" weight="bold">
            swap (Deprecated)
          </Text>
        </Box>
      </>
    ),
};

export const padding: Example = {
  name: 'Padding',
  Example: () =>
    source(
      <Stack space="12px">
        <Box background="surface" padding="19px">
          <Placeholder />
        </Box>
        <Box background="surface" paddingHorizontal="19px">
          <Placeholder />
        </Box>
        <Box background="surface" paddingVertical="19px">
          <Placeholder />
        </Box>
        <Box background="surface" paddingLeft="19px">
          <Placeholder />
        </Box>
        <Box background="surface" paddingRight="19px">
          <Placeholder />
        </Box>
        <Box background="surface" paddingTop="19px">
          <Placeholder />
        </Box>
        <Box background="surface" paddingBottom="19px">
          <Placeholder />
        </Box>
      </Stack>
    ),
};

export const margin: Example = {
  name: 'Margin',
  Example: () =>
    source(
      <Stack space="12px">
        <Box background="surface" margin="-19px">
          <Placeholder />
        </Box>
        <Inset vertical="19px">
          <Box background="surface" marginHorizontal="-19px">
            <Placeholder />
          </Box>
        </Inset>
        <Box background="surface" marginVertical="-19px">
          <Placeholder />
        </Box>
        <Inset vertical="19px">
          <Box background="surface" marginLeft="-19px">
            <Placeholder />
          </Box>
        </Inset>
        <Box background="surface" marginRight="-19px">
          <Placeholder />
        </Box>
        <Inset vertical="19px">
          <Box background="surface" marginTop="-19px">
            <Placeholder />
          </Box>
        </Inset>
        <Box background="surface" marginBottom="-19px">
          <Placeholder />
        </Box>
      </Stack>
    ),
};

export const borderRadius: Example = {
  name: 'Border radius',
  Example: () =>
    source(
      <Stack space="24px">
        <Box background="accent" borderRadius={16} padding="19px" />
        <Box background="accent" borderLeftRadius={16} padding="19px" />
        <Box background="accent" borderRightRadius={16} padding="19px" />
        <Box background="accent" borderTopRadius={16} padding="19px" />
        <Box background="accent" borderBottomRadius={16} padding="19px" />
        <Box background="accent" borderBottomLeftRadius={16} padding="19px" />
        <Box background="accent" borderBottomRightRadius={16} padding="19px" />
        <Box background="accent" borderTopLeftRadius={16} padding="19px" />
        <Box background="accent" borderTopRightRadius={16} padding="19px" />
      </Stack>
    ),
};

export const widths: Example = {
  name: 'Widths',
  Example: () =>
    source(
      <Stack space="12px">
        <Box background="accent" padding="24px" width="1/3" />
        <Box background="accent" padding="24px" width="full" />
        <Box background="accent" padding="24px" width={{ custom: 30 }} />
      </Stack>
    ),
};

export const heights: Example = {
  name: 'Heights',
  Example: () =>
    source(
      <Stack space="12px">
        <Box background="accent" height="30px" />
        <Box background="accent" height="40px" />
        <Box background="accent" height="46px" />
        <Box background="accent" height="56px" />
        <Box background="accent" height="64px" />
        <Box background="accent" height={{ custom: 30 }} />
      </Stack>
    ),
};

export const shadows: Example = {
  name: 'Shadows',
  Example: () =>
    source(<Box background="surface" padding="24px" shadow="30px light" />),
};

export const shadowsWithSizes: Example = {
  name: 'Shadows',
  subTitle: 'Sizes',
  Example: () =>
    source(
      <Stack space="30px">
        <Columns space="30px">
          <Column width="1/3" />
          <Column width="1/3">
            <Box background="surface" padding="15px" shadow="9px medium" />
          </Column>
        </Columns>
        <Columns space="30px">
          <Column width="1/3" />
          <Column width="1/3">
            <Box background="surface" padding="15px" shadow="12px medium" />
          </Column>
          <Column width="1/3">
            <Box background="surface" padding="15px" shadow="12px heavy" />
          </Column>
        </Columns>
        <Columns space="30px">
          <Column width="1/3">
            <Box background="surface" padding="15px" shadow="21px light" />
          </Column>
          <Column width="1/3" />
          <Column width="1/3">
            <Box background="surface" padding="15px" shadow="21px heavy" />
          </Column>
        </Columns>
        <Columns space="30px">
          <Box background="surface" padding="15px" shadow="30px light" />
          <Box background="surface" padding="15px" shadow="30px medium" />
          <Box background="surface" padding="15px" shadow="30px heavy" />
        </Columns>
      </Stack>
    ),
};

export const shadowsWithColors: Example = {
  name: 'Shadows',
  subTitle: 'Colors',
  Example: () =>
    source(
      <Columns space="30px">
        <Box background="surface" padding="15px" shadow="12px medium accent" />
        <Box
          background="surface"
          padding="15px"
          shadow="21px heavy swap (Deprecated)"
        />
        <Box
          background="surface"
          padding="15px"
          shadow="30px heavy action (Deprecated)"
        />
      </Columns>
    ),
};

export const shadowsWithCustom: Example = {
  name: 'Shadows',
  subTitle: 'Custom shadows',
  Example: () =>
    source(
      <Columns space="30px">
        <Box
          background="surface"
          padding="15px"
          shadow={{
            custom: {
              ios: [
                {
                  offset: { x: 0, y: 5 },
                  opacity: 0.05,
                  blur: 10,
                },
                {
                  offset: { x: 0, y: 10 },
                  opacity: 0.15,
                  blur: 20,
                },
              ],
              android: {
                elevation: 15,
                opacity: 0.5,
              },
            },
          }}
        />
        <Box
          background="surface"
          padding="15px"
          shadow={{
            custom: {
              ios: [
                {
                  color: { custom: '#FF54BB' },
                  offset: { x: 0, y: 2 },
                  opacity: 0.5,
                  blur: 5,
                },
                {
                  color: 'swap (Deprecated)',
                  offset: { x: 0, y: 4 },
                  opacity: 0.5,
                  blur: 10,
                },
                {
                  color: 'shadow',
                  offset: { x: 0, y: 4 },
                  opacity: 0.5,
                  blur: 15,
                },
              ],
              android: {
                color: { custom: '#FF54BB' },
                elevation: 15,
                opacity: 1,
              },
            },
          }}
        />
      </Columns>
    ),
};
