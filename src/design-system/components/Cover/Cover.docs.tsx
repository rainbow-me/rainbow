import React from 'react';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';

import * as examples from './Cover.examples';
import meta from './Cover.meta';

const docs: DocsType = {
  meta,
  description: (
    <>
      <Docs.Text>
        Allows for the child node to cover the parent component with absolute positioning. This component behaves internally like React
        Native&apos;s <Docs.Code>StyleSheet.absoluteFill</Docs.Code>.
      </Docs.Text>
    </>
  ),
  examples: [
    examples.basicUsage,
    {
      ...examples.centerAlignedHorizontally,
      description: (
        <Docs.Text>
          To align content horizontally within the cover, use the <Docs.Code>alignHorizontal</Docs.Code> prop.
        </Docs.Text>
      ),
    },
    examples.rightAlignedHorizontally,
    examples.justifiedHorizontally,
    {
      ...examples.centerAlignedVertically,
      description: (
        <Docs.Text>
          To align content vertically within the cover, use the <Docs.Code>alignVertical</Docs.Code> prop.
        </Docs.Text>
      ),
    },
    examples.bottomAlignedVertically,
  ],
};

export default docs;
