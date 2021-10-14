/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Bleed } from './Bleed';

const pink = 'rgba(255,0,0,0.2)';

const docs: Docs = {
  name: 'Bleed',
  examples: [
    {
      name: 'Basic usage',
      example: (
        <View style={{ backgroundColor: pink }}>
          <Inset space="19dp">
            <Stack space="19dp">
              <Placeholder height={100} />
              <Bleed horizontal="19dp">
                <Placeholder height={100} />
              </Bleed>
              <Placeholder height={100} />
            </Stack>
          </Inset>
        </View>
      ),
    },

    {
      name: 'Right',
      example: (
        <View style={{ backgroundColor: pink }}>
          <Inset space="19dp">
            <Stack space="19dp">
              <Placeholder height={100} />
              <Bleed right="19dp">
                <Placeholder height={100} />
              </Bleed>
              <Placeholder height={100} />
            </Stack>
          </Inset>
        </View>
      ),
    },

    {
      name: 'Left',
      example: (
        <View style={{ backgroundColor: pink }}>
          <Inset space="19dp">
            <Stack space="19dp">
              <Placeholder height={100} />
              <Bleed left="19dp">
                <Placeholder height={100} />
              </Bleed>
              <Placeholder height={100} />
            </Stack>
          </Inset>
        </View>
      ),
    },

    {
      name: 'Top',
      example: (
        <View style={{ backgroundColor: pink }}>
          <Inset space="19dp">
            <Stack space="19dp">
              <Bleed top="19dp">
                <Placeholder height={100} />
              </Bleed>
              <Placeholder height={100} />
              <Placeholder height={100} />
            </Stack>
          </Inset>
        </View>
      ),
    },

    {
      name: 'Bottom',
      example: (
        <View style={{ backgroundColor: pink }}>
          <Inset space="19dp">
            <Stack space="19dp">
              <Placeholder height={100} />
              <Placeholder height={100} />
              <Bleed bottom="19dp">
                <Placeholder height={100} />
              </Bleed>
            </Stack>
          </Inset>
        </View>
      ),
    },
  ],
};

export default docs;
