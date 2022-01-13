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
            <Columns space="30px">
              <Column width="1/3">
                <Box background="body" padding="15px" shadow="9px light" />
              </Column>
            </Columns>
            <Columns space="30px">
              <Column width="1/3">
                <Box background="body" padding="15px" shadow="12px medium" />
              </Column>
              <Column width="1/3">
                <Box background="body" padding="15px" shadow="12px heavy" />
              </Column>
            </Columns>
            <Columns space="30px">
              <Box background="body" padding="15px" shadow="30px light" />
              <Box background="body" padding="15px" shadow="30px medium" />
              <Box background="body" padding="15px" shadow="30px heavy" />
            </Columns>
            <Columns space="30px">
              <Box
                background="body"
                padding="15px"
                shadow="30px heavy"
                shadowColor="swap"
              />
              <Box
                background="body"
                padding="15px"
                shadow="30px heavy"
                shadowColor="action"
              />
              <Box
                background="body"
                padding="15px"
                shadow="30px heavy"
                shadowColor={['shadow', 'swap']}
              />
            </Columns>
            <Columns space="30px">
              <Box
                background="body"
                padding="15px"
                shadow="12px heavy"
                shadowColor={{ custom: 'red' }}
              />
              <Box
                background="body"
                padding="15px"
                shadow="12px heavy"
                shadowColor={[{ custom: 'red' }, 'swap']}
              />
            </Columns>
            <Columns space="30px">
              <Box
                background="body"
                padding="15px"
                shadow={{
                  custom: [
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
                }}
              />
              <Box
                background="body"
                padding="15px"
                shadow={{
                  custom: [
                    {
                      offset: { x: 0, y: 2 },
                      opacity: 1,
                      blur: 5,
                    },
                    {
                      offset: { x: 0, y: 4 },
                      opacity: 1,
                      blur: 10,
                    },
                    {
                      offset: { x: 0, y: 6 },
                      opacity: 1,
                      blur: 15,
                    },
                  ],
                }}
                shadowColor={[
                  { custom: '#FF54BB' },
                  { custom: '#00F0FF' },
                  { custom: '#FFB114' },
                ]}
              />
            </Columns>
          </Stack>
        ),
    },
  ],
};

export default playground;
