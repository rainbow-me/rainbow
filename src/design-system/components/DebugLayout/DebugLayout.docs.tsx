import React from 'react';
import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import * as examples from './DebugLayout.examples';
import meta from './DebugLayout.meta';

const docs: DocsType = {
  meta,
  description: (
    <Docs.Text>
      Renders a bright red container around a child element to help debug its position within a layout during development.
    </Docs.Text>
  ),
  examples: [examples.basicUsage],
};

export default docs;
