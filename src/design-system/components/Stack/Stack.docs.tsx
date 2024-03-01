import React from 'react';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';

import * as examples from './Stack.examples';
import meta from './Stack.meta';

const docs: DocsType = {
  meta,
  description: (
    <>
      <Docs.Text>
        Arranges children <Docs.Strong>vertically</Docs.Strong> with equal spacing between them, plus an optional{' '}
        <Docs.Code>separator</Docs.Code> element. Items can be aligned with <Docs.Code>alignHorizontal</Docs.Code>.
      </Docs.Text>
      <Docs.Text>If there is only a single child node, no space or separators will be rendered.</Docs.Text>
    </>
  ),
  examples: [
    examples.basicUsage,
    examples.customSpace,
    {
      ...examples.nested,
      description: (
        <Docs.Text>Stacks can be nested within each other for layouts with differing amounts of space between groups of content.</Docs.Text>
      ),
    },
    examples.withText,
    examples.withCenterAlignment,
    examples.withSeparators,
    examples.withCenterAlignmentAndDividers,
    examples.withRightAlignmentAndDividers,
    examples.withNoSpaceAndSeparators,
  ],
};

export default docs;
