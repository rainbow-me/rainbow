import React from 'react';

import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { ColorModeProvider } from '../../color/ColorMode';
import { Columns } from '../Columns/Columns';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Box } from './Box';

export const background: Example = {
  name: 'Background',
  Example: () =>
    source(
      <>
        <Box background="surfacePrimary" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            surfacePrimary
          </Text>
        </Box>
        <Box background="surfacePrimaryElevated" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            surfacePrimaryElevated
          </Text>
        </Box>
        <Box background="surfaceSecondary" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            surfaceSecondary
          </Text>
        </Box>
        <Box background="surfaceSecondaryElevated" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            surfaceSecondaryElevated
          </Text>
        </Box>
        <Box background="fill" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            fill
          </Text>
        </Box>
        <Box background="fillSecondary" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            fillSecondary
          </Text>
        </Box>
        <Box background="accent" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            accent
          </Text>
        </Box>
        <Box background="blue" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            blue
          </Text>
        </Box>
        <Box background="green" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            green
          </Text>
        </Box>
        <Box background="red" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            red
          </Text>
        </Box>
        <Box background="purple" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            purple
          </Text>
        </Box>
        <Box background="pink" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            pink
          </Text>
        </Box>
        <Box background="orange" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            orange
          </Text>
        </Box>
        <Box background="yellow" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            yellow
          </Text>
        </Box>
        <Box background="body (Deprecated)" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            body (Deprecated)
          </Text>
        </Box>
        <Box background="action (Deprecated)" padding={20}>
          <Text color="label" size="17pt" weight="bold">
            action (Deprecated)
          </Text>
        </Box>
        <Box background="swap (Deprecated)" padding={20}>
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
      <Stack space={12}>
        <Box background="surfacePrimary" padding={20}>
          <Placeholder />
        </Box>
        <Box background="surfacePrimary" paddingHorizontal={20}>
          <Placeholder />
        </Box>
        <Box background="surfacePrimary" paddingVertical={20}>
          <Placeholder />
        </Box>
        <Box background="surfacePrimary" paddingLeft={20}>
          <Placeholder />
        </Box>
        <Box background="surfacePrimary" paddingRight={20}>
          <Placeholder />
        </Box>
        <Box background="surfacePrimary" paddingTop={20}>
          <Placeholder />
        </Box>
        <Box background="surfacePrimary" paddingBottom={20}>
          <Placeholder />
        </Box>
      </Stack>
    ),
};

export const margin: Example = {
  name: 'Margin',
  Example: () =>
    source(
      <Stack space={12}>
        <Box background="surfacePrimary" margin={-20}>
          <Placeholder />
        </Box>
        <Inset vertical={20}>
          <Box background="surfacePrimary" marginHorizontal={-20}>
            <Placeholder />
          </Box>
        </Inset>
        <Box background="surfacePrimary" marginVertical={-20}>
          <Placeholder />
        </Box>
        <Inset vertical={20}>
          <Box background="surfacePrimary" marginLeft={-20}>
            <Placeholder />
          </Box>
        </Inset>
        <Box background="surfacePrimary" marginRight={-20}>
          <Placeholder />
        </Box>
        <Inset vertical={20}>
          <Box background="surfacePrimary" marginTop={-20}>
            <Placeholder />
          </Box>
        </Inset>
        <Box background="surfacePrimary" marginBottom={-20}>
          <Placeholder />
        </Box>
      </Stack>
    ),
};

export const borderRadius: Example = {
  name: 'Border radius',
  Example: () =>
    source(
      <Stack space={24}>
        <Box background="accent" borderRadius={16} padding={20} />
        <Box background="accent" borderLeftRadius={16} padding={20} />
        <Box background="accent" borderRightRadius={16} padding={20} />
        <Box background="accent" borderTopRadius={16} padding={20} />
        <Box background="accent" borderBottomRadius={16} padding={20} />
        <Box background="accent" borderBottomLeftRadius={16} padding={20} />
        <Box background="accent" borderBottomRightRadius={16} padding={20} />
        <Box background="accent" borderTopLeftRadius={16} padding={20} />
        <Box background="accent" borderTopRightRadius={16} padding={20} />
      </Stack>
    ),
};

export const widths: Example = {
  name: 'Widths',
  Example: () =>
    source(
      <Stack space={12}>
        <Box background="accent" padding={24} width="1/3" />
        <Box background="accent" padding={24} width="full" />
        <Box background="accent" padding={24} width={30} />
      </Stack>
    ),
};

export const heights: Example = {
  name: 'Heights',
  Example: () =>
    source(
      <Stack space={12}>
        <Box background="accent" height={30} />
        <Box background="accent" height={40} />
        <Box background="accent" height={46} />
        <Box background="accent" height={56} />
        <Box background="accent" height={64} />
        <Box background="accent" height={30} />
      </Stack>
    ),
};

export const shadows: Example = {
  name: 'Shadows',
  Example: () =>
    source(
      <Stack>
        <ColorModeProvider value="light">
          <Box background="surfacePrimary">
            <Inset space={32}>
              <Stack space={32}>
                <Columns space={20}>
                  <Box
                    borderRadius={18}
                    background="surfacePrimaryElevated"
                    padding={12}
                    shadow="12px"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      12px
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="accent"
                    padding={12}
                    shadow="12px accent"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Accent
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="purple"
                    padding={12}
                    shadow="12px purple"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Purple
                    </Text>
                  </Box>
                </Columns>
                <Columns space={20}>
                  <Box
                    borderRadius={18}
                    background="surfacePrimaryElevated"
                    padding={12}
                    shadow="18px"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      18px
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="accent"
                    padding={12}
                    shadow="18px accent"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Accent
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="purple"
                    padding={12}
                    shadow="18px purple"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Purple
                    </Text>
                  </Box>
                </Columns>
                <Columns space={20}>
                  <Box
                    borderRadius={18}
                    background="surfacePrimaryElevated"
                    padding={12}
                    shadow="24px"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      24px
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="accent"
                    padding={12}
                    shadow="24px accent"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Accent
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="purple"
                    padding={12}
                    shadow="24px purple"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Purple
                    </Text>
                  </Box>
                </Columns>
                <Columns space={20}>
                  <Box
                    borderRadius={18}
                    background="surfacePrimaryElevated"
                    padding={12}
                    shadow="30px"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      30px
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="accent"
                    padding={12}
                    shadow="30px accent"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Accent
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="purple"
                    padding={12}
                    shadow="30px purple"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Purple
                    </Text>
                  </Box>
                </Columns>
              </Stack>
            </Inset>
          </Box>
        </ColorModeProvider>
        <ColorModeProvider value="dark">
          <Box background="surfacePrimary">
            <Inset space={32}>
              <Stack space={32}>
                <Columns space={20}>
                  <Box
                    borderRadius={18}
                    background="surfacePrimaryElevated"
                    padding={12}
                    shadow="12px"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      12px
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="accent"
                    padding={12}
                    shadow="12px accent"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Accent
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="purple"
                    padding={12}
                    shadow="12px purple"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Purple
                    </Text>
                  </Box>
                </Columns>
                <Columns space={20}>
                  <Box
                    borderRadius={18}
                    background="surfacePrimaryElevated"
                    padding={12}
                    shadow="18px"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      18px
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="accent"
                    padding={12}
                    shadow="18px accent"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Accent
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="purple"
                    padding={12}
                    shadow="18px purple"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Purple
                    </Text>
                  </Box>
                </Columns>
                <Columns space={20}>
                  <Box
                    borderRadius={18}
                    background="surfacePrimaryElevated"
                    padding={12}
                    shadow="24px"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      24px
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="accent"
                    padding={12}
                    shadow="24px accent"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Accent
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="purple"
                    padding={12}
                    shadow="24px purple"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Purple
                    </Text>
                  </Box>
                </Columns>
                <Columns space={20}>
                  <Box
                    borderRadius={18}
                    background="surfacePrimaryElevated"
                    padding={12}
                    shadow="30px"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      30px
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="accent"
                    padding={12}
                    shadow="30px accent"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Accent
                    </Text>
                  </Box>
                  <Box
                    borderRadius={18}
                    background="purple"
                    padding={12}
                    shadow="30px purple"
                  >
                    <Text
                      size="15pt"
                      color="label"
                      weight="bold"
                      align="center"
                    >
                      Purple
                    </Text>
                  </Box>
                </Columns>
              </Stack>
            </Inset>
          </Box>
        </ColorModeProvider>
      </Stack>
    ),
};

export const shadowsWithCustom: Example = {
  name: 'Shadows',
  subTitle: 'Custom shadows',
  Example: () =>
    source(
      <Columns space={32}>
        <Box
          background="surfacePrimary"
          padding={16}
          shadow={{
            custom: {
              light: {
                ios: [
                  { x: 0, y: 5, blur: 10, color: 'shadowFar', opacity: 0.05 },
                  { x: 0, y: 10, blur: 20, color: 'shadowFar', opacity: 0.15 },
                ],
                android: { elevation: 15, color: 'shadowFar', opacity: 0.5 },
              },
              dark: {
                ios: [
                  { x: 0, y: 5, blur: 10, color: 'shadowFar', opacity: 0.05 },
                  { x: 0, y: 10, blur: 20, color: 'shadowFar', opacity: 0.15 },
                ],
                android: { elevation: 15, color: 'shadowFar', opacity: 0.5 },
              },
            },
          }}
        />
        <Box
          background="surfacePrimary"
          padding={16}
          shadow={{
            custom: {
              light: {
                ios: [
                  {
                    x: 0,
                    y: 2,
                    blur: 5,
                    color: { custom: '#FF54BB' },
                    opacity: 0.5,
                  },
                  { x: 0, y: 4, blur: 10, color: 'accent', opacity: 0.5 },
                  { x: 0, y: 4, blur: 15, color: 'shadowFar', opacity: 0.5 },
                ],
                android: {
                  elevation: 15,
                  color: { custom: '#FF54BB' },
                  opacity: 1,
                },
              },
              dark: {
                ios: [
                  {
                    x: 0,
                    y: 2,
                    blur: 5,
                    color: { custom: '#FF54BB' },
                    opacity: 0.5,
                  },
                  { x: 0, y: 4, blur: 10, color: 'accent', opacity: 0.5 },
                  { x: 0, y: 4, blur: 15, color: 'shadowFar', opacity: 0.5 },
                ],
                android: {
                  elevation: 15,
                  color: { custom: '#FF54BB' },
                  opacity: 1,
                },
              },
            },
          }}
        />
      </Columns>
    ),
};
