/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Row } from '../Row/Row';
import { Divider } from './Divider';

const docs: Docs = {
  name: 'Divider',
  category: 'Content',
  examples: [
    {
      name: 'Default usage',
      Example: () => <Divider />,
    },
    {
      name: 'Color: divider80',
      Example: () => <Divider color="divider80" />,
    },
    {
      name: 'Color: divider60',
      Example: () => <Divider color="divider60" />,
    },
    {
      name: 'Color: divider40',
      Example: () => <Divider color="divider40" />,
    },
    {
      name: 'Color: divider20',
      Example: () => <Divider color="divider20" />,
    },
    {
      name: 'Vertical',
      Example: () => (
        <Row space="19px">
          <Placeholder width={20} />
          <Divider direction="vertical" />
          <Placeholder width={20} />
          <Divider direction="vertical" />
          <Placeholder width={20} />
        </Row>
      ),
    },
  ],
};

export default docs;
