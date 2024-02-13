import React from 'react';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';

import * as examples from './Rows.examples';
import meta from './Rows.meta';

const docs: DocsType = {
  meta,
  description: (
    <>
      <Docs.Text>
        Renders children <Docs.Strong>vertically</Docs.Strong> in equal-height rows by default, with consistent spacing between them.
      </Docs.Text>
      <Docs.Text>If there is only a single row, no space will be rendered.</Docs.Text>
    </>
  ),
  examples: [
    examples.basicUsage,
    examples.customSpace,
    {
      ...examples.customHeights,
      description: (
        <>
          <Docs.Text>
            You can optionally control row heights by manually rendering a <Docs.Code>Row</Docs.Code> as a direct child of{' '}
            <Docs.Code>Rows</Docs.Code>, which allows you to set an explicit <Docs.Code>height</Docs.Code> prop.
          </Docs.Text>
          <Docs.Text>
            A common usage of this is to make a row shrink to the height of its content. This can be achieved by setting the row{' '}
            <Docs.Code>height</Docs.Code> prop to <Docs.Code>&quot;content&quot;</Docs.Code>. Any rows without an explicit height will share
            the remaining space equally.
          </Docs.Text>
        </>
      ),
    },
    examples.rowWithContentHeight,
    examples.nestedRows,
    examples.nestedRowsWithExplicitHeights,
    examples.nestedRowsWithExplicitHeightsContent,
    examples.centerAlignedVertically,
    examples.bottomAlignedVertically,
    examples.centerAlignedHorizontally,
    examples.rightAlignedHorizontally,
  ],
};

export default docs;
