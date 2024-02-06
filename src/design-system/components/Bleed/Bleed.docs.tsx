import React from 'react';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';

import * as examples from './Bleed.examples';
import meta from './Bleed.meta';

const docs: DocsType = {
  meta,
  description: (
    <>
      <Docs.Text>
        Renders a <Docs.Strong>container with negative margins</Docs.Strong> allowing content to{' '}
        <Docs.TextLink href="https://en.wikipedia.org/wiki/Bleed_(printing)">&quot;bleed&quot;</Docs.TextLink> into the surrounding layout.
        This effectively works as the opposite of <Docs.Strong>Inset</Docs.Strong> and is designed to support visually breaking out of a
        parent container without having to refactor the entire component tree.
      </Docs.Text>
      <Docs.Text>If there is only a single child node, no space or separators will be rendered.</Docs.Text>
    </>
  ),
  examples: [
    {
      ...examples.basicUsage,
      showFrame: true,
    },
    {
      ...examples.horizontal,
      showFrame: true,
    },
    {
      ...examples.vertical,
      showFrame: true,
    },
    {
      ...examples.customSpace,
      showFrame: true,
    },
    {
      ...examples.right,
      showFrame: true,
    },
    {
      ...examples.left,
      showFrame: true,
    },
    {
      ...examples.top,
      showFrame: true,
    },
    {
      ...examples.bottom,
      showFrame: true,
    },
    {
      ...examples.allSides,
      showFrame: true,
    },
  ],
};

export default docs;
