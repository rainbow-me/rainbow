import React from 'react';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';

import * as examples from './Inline.examples';
import meta from './Inline.meta';

const docs: DocsType = {
  meta,
  description: (
    <>
      <Docs.Text>
        Arranges child nodes <Docs.Strong>horizontally, wrapping to multiple lines if needed</Docs.Strong>, with equal spacing between
        items.
      </Docs.Text>
      <Docs.Text>If there is only a single child node, no space will be rendered.</Docs.Text>
    </>
  ),
  examples: [
    examples.basicUsage,
    {
      ...examples.noWrap,
      description: (
        <Docs.Text>
          To disable wrapping of the child nodes, set the <Docs.Code>wrap</Docs.Code> prop to <Docs.Code>false</Docs.Code>.
        </Docs.Text>
      ),
    },
    examples.noWrap,
    examples.customSpace,
    examples.differentSpaceOnAxis,
    examples.customSpaceOnAxis,
    {
      ...examples.centerAlignedHorizontally,
      description: (
        <Docs.Text>
          To align content horizontally within the component, use the <Docs.Code>alignHorizontal</Docs.Code> prop.
        </Docs.Text>
      ),
    },
    examples.rightAlignedHorizontally,
    {
      ...examples.centerAlignedVertically,
      description: (
        <Docs.Text>
          To align content vertically within the component, use the <Docs.Code>alignVertical</Docs.Code> prop.
        </Docs.Text>
      ),
    },
    examples.bottomAlignedVertically,
    examples.centerAlignedHorizontallyVertically,
    examples.fixedHeightSeparators,
    examples.fixedHeightSeparatorsVerticalAlignment,
    examples.fixedHeightSeparatorsHorizontalAlignment,
    examples.fullHeightSeparators,
    examples.noSpaceAndSeparators,
  ],
};

export default docs;
