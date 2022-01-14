/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';

import { Playground } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Stack } from '../Stack/Stack';

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
            {examples.shadows.Example?.()}
            {examples.shadowsWithSizes.Example?.()}
            {examples.shadowsWithColors.Example?.()}
            {examples.shadowsWithCustom.Example?.()}
          </Stack>
        ),
    },
  ],
};

export default playground;
