/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';

import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Box } from './Box';

export const background: Example = {
  name: 'Background',
  Example: () =>
    source(
      <>
        <Box background="body" padding="19px">
          <Text size="18px" weight="bold">
            Body
          </Text>
        </Box>
        <Box background="accent" padding="19px">
          <Text size="18px" weight="bold">
            Accent
          </Text>
        </Box>
        <Box background="action" padding="19px">
          <Text size="18px" weight="bold">
            Action
          </Text>
        </Box>
        <Box background="swap" padding="19px">
          <Text size="18px" weight="bold">
            Swap
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
        <Box background="body" padding="19px">
          <Placeholder />
        </Box>
        <Box background="body" paddingHorizontal="19px">
          <Placeholder />
        </Box>
        <Box background="body" paddingVertical="19px">
          <Placeholder />
        </Box>
        <Box background="body" paddingLeft="19px">
          <Placeholder />
        </Box>
        <Box background="body" paddingRight="19px">
          <Placeholder />
        </Box>
        <Box background="body" paddingTop="19px">
          <Placeholder />
        </Box>
        <Box background="body" paddingBottom="19px">
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
        <Box background="body" margin="-19px">
          <Placeholder />
        </Box>
        <Inset vertical="19px">
          <Box background="body" marginHorizontal="-19px">
            <Placeholder />
          </Box>
        </Inset>
        <Box background="body" marginVertical="-19px">
          <Placeholder />
        </Box>
        <Inset vertical="19px">
          <Box background="body" marginLeft="-19px">
            <Placeholder />
          </Box>
        </Inset>
        <Box background="body" marginRight="-19px">
          <Placeholder />
        </Box>
        <Inset vertical="19px">
          <Box background="body" marginTop="-19px">
            <Placeholder />
          </Box>
        </Inset>
        <Box background="body" marginBottom="-19px">
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
