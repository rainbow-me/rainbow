/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Box } from '../Box/Box';
import { Row } from '../Row/Row';
import { Divider } from './Divider';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Box background="body" borderRadius={8} padding="19px">
        <Divider />
      </Box>
    ),
};

export const divider80: Example = {
  name: 'Color: divider80',
  Example: () =>
    source(
      <Box background="body" borderRadius={8} padding="19px">
        <Divider color="divider80" />
      </Box>
    ),
};

export const divider60: Example = {
  name: 'Color: divider60',
  Example: () =>
    source(
      <Box background="body" borderRadius={8} padding="19px">
        <Divider color="divider60" />
      </Box>
    ),
};

export const divider40: Example = {
  name: 'Color: divider40',
  Example: () =>
    source(
      <Box background="body" borderRadius={8} padding="19px">
        <Divider color="divider40" />
      </Box>
    ),
};

export const divider20: Example = {
  name: 'Color: divider20',
  Example: () =>
    source(
      <Box background="body" borderRadius={8} padding="19px">
        <Divider color="divider20" />
      </Box>
    ),
};

export const vertical: Example = {
  name: 'Vertical',
  Example: () =>
    source(
      <Box background="body" borderRadius={8} padding="19px">
        <Row space="19px">
          <Placeholder width={20} />
          <Divider direction="vertical" />
          <Placeholder width={20} />
          <Divider direction="vertical" />
          <Placeholder width={20} />
        </Row>
      </Box>
    ),
};
