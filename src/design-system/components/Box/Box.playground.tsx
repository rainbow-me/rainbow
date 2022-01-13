/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';

import { Playground } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Column, Columns } from '../Columns/Columns';
import { Stack } from '../Stack/Stack';

import { Box } from './Box';
import * as examples from './Box.examples';
import meta from './Box.meta';

const playground: Playground = {
  meta,
  examples: [
    examples.background,
    examples.padding,
    examples.margin,
    examples.borderRadius,
    examples.widths,
    {
      name: 'Shadows',
      Example: () =>
        source(
          <Stack space="30px">
            {examples.shadowsWithSizes.Example?.()}
            {examples.shadowsWithColors.Example?.()}
            {examples.shadowsWithCustomColors.Example?.()}
            {examples.shadowsWithCustomSizes.Example?.()}
          </Stack>
        ),
    },
  ],
};

export default playground;
