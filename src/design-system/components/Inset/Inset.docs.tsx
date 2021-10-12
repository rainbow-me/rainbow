/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { Docs } from '../../playground/Docs';
import { PlaceHolder } from '../../playground/Placeholder';
import { Inset } from './Inset';

const pink = 'rgba(255,0,0,0.2)';

const docs: Docs = {
  name: 'Inset',
  examples: [
    {
      name: 'Basic usage',
      example: (
        <View style={{ backgroundColor: pink }}>
          <Inset space="gutter">
            <PlaceHolder height={100} />
          </Inset>
        </View>
      ),
    },

    {
      name: 'Horizontal space',
      example: (
        <View style={{ backgroundColor: pink }}>
          <Inset horizontal="gutter">
            <PlaceHolder height={100} />
          </Inset>
        </View>
      ),
    },

    {
      name: 'Vertical space',
      example: (
        <View style={{ backgroundColor: pink }}>
          <Inset vertical="gutter">
            <PlaceHolder height={100} />
          </Inset>
        </View>
      ),
    },
  ],
};

export default docs;
