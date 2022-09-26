import React from 'react';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Box } from '../Box/Box';
import { Inline } from '../Inline/Inline';
import { Separator } from './Separator';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Box background="surfacePrimary" borderRadius={8} padding="20px">
        <Separator color="separator" />
      </Box>
    ),
};

export const secondary: Example = {
  name: 'Secondary',
  Example: () =>
    source(
      <Box background="surfacePrimary" borderRadius={8} padding="20px">
        <Separator color="separatorSecondary" />
      </Box>
    ),
};

export const divider80: Example = {
  name: 'Color: divider80 (Deprecated)',
  Example: () =>
    source(
      <Box background="surfacePrimary" borderRadius={8} padding="20px">
        <Separator color="divider80 (Deprecated)" />
      </Box>
    ),
};

export const divider60: Example = {
  name: 'Color: divider60 (Deprecated)',
  Example: () =>
    source(
      <Box background="surfacePrimary" borderRadius={8} padding="20px">
        <Separator color="divider60 (Deprecated)" />
      </Box>
    ),
};

export const divider40: Example = {
  name: 'Color: divider40 (Deprecated)',
  Example: () =>
    source(
      <Box background="surfacePrimary" borderRadius={8} padding="20px">
        <Separator color="divider40 (Deprecated)" />
      </Box>
    ),
};

export const divider20: Example = {
  name: 'Color: divider20 (Deprecated)',
  Example: () =>
    source(
      <Box background="surfacePrimary" borderRadius={8} padding="20px">
        <Separator color="divider20 (Deprecated)" />
      </Box>
    ),
};

export const vertical: Example = {
  name: 'Vertical',
  Example: () =>
    source(
      <Box background="surfacePrimary" borderRadius={8} padding="20px">
        <Inline space="20px" wrap={false}>
          <Placeholder width={20} />
          <Separator color="separator" direction="vertical" />
          <Placeholder width={20} />
          <Separator color="separator" direction="vertical" />
          <Placeholder width={20} />
        </Inline>
      </Box>
    ),
};
