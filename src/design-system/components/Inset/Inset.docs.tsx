/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from './Inset';

const docs: DocsType = {
  name: 'Inset',
  category: 'Layout',
  description: (
    <Docs.Text>
      Renders a <Docs.Strong>container with equal padding</Docs.Strong> on all
      sides.
    </Docs.Text>
  ),
  examples: [
    {
      name: 'Basic usage',
      showFrame: true,
      Example: () =>
        source(
          <Inset space="19px">
            <Placeholder height={100} />
          </Inset>
        ),
    },

    {
      name: 'Custom space',
      showFrame: true,
      Example: () =>
        source(
          <Inset space={{ custom: 12 }}>
            <Placeholder height={100} />
          </Inset>
        ),
    },

    {
      name: 'Horizontal space',
      description: (
        <Docs.Text>Space can also be customized per axis.</Docs.Text>
      ),
      showFrame: true,
      Example: () =>
        source(
          <Inset horizontal="19px">
            <Placeholder height={100} />
          </Inset>
        ),
    },

    {
      name: 'Vertical space',
      showFrame: true,
      Example: () =>
        source(
          <Inset vertical="19px">
            <Placeholder height={100} />
          </Inset>
        ),
    },
  ],
};

export default docs;
