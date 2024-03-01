import React from 'react';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';

import * as examples from './Inset.examples';
import meta from './Inset.meta';

const docs: DocsType = {
  meta,
  description: (
    <Docs.Text>
      Renders a <Docs.Strong>container with padding.</Docs.Strong>
    </Docs.Text>
  ),
  examples: [
    {
      ...examples.basicUsage,
      showFrame: true,
    },
    {
      ...examples.customSpace,
      showFrame: true,
    },
    {
      ...examples.horizontalSpace,
      description: <Docs.Text>Space can also be customized per axis.</Docs.Text>,
      showFrame: true,
    },
    {
      ...examples.verticalSpace,
      showFrame: true,
    },
    {
      ...examples.topSpace,
      showFrame: true,
    },
    {
      ...examples.bottomSpace,
      showFrame: true,
    },
    {
      ...examples.leftSpace,
      showFrame: true,
    },
    {
      ...examples.rightSpace,
      showFrame: true,
    },
  ],
};

export default docs;
