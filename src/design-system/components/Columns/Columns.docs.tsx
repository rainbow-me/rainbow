import React from 'react';

import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';

import * as examples from './Columns.examples';
import meta from './Columns.meta';

const docs: DocsType = {
  meta,
  description: (
    <>
      <Docs.Text>
        Renders children <Docs.Strong>horizontally</Docs.Strong> in equal-width columns by default, with consistent spacing between them.
      </Docs.Text>
      <Docs.Text>If there is only a single column, no space will be rendered.</Docs.Text>
    </>
  ),
  examples: [
    examples.basicUsage,
    examples.customSpace,
    {
      ...examples.customWidths,
      description: (
        <>
          <Docs.Text>
            You can optionally control column widths by manually rendering a <Docs.Code>Column</Docs.Code> as a direct child of{' '}
            <Docs.Code>Columns</Docs.Code>, which allows you to set an explicit <Docs.Code>width</Docs.Code> prop.
          </Docs.Text>
          <Docs.Text>
            A common usage of this is to make a column shrink to the width of its content. This can be achieved by setting the column{' '}
            <Docs.Code>width</Docs.Code> prop to <Docs.Code>&quot;content&quot;</Docs.Code>. Any columns without an explicit width will
            share the remaining space equally.
          </Docs.Text>
          <Docs.Text>
            The following fractional widths are also available: <Docs.Code>1/2</Docs.Code>, <Docs.Code>1/3</Docs.Code>,{' '}
            <Docs.Code>2/3</Docs.Code>, <Docs.Code>1/4</Docs.Code>, <Docs.Code>3/4</Docs.Code>, <Docs.Code>1/5</Docs.Code>,{' '}
            <Docs.Code>2/5</Docs.Code>, <Docs.Code>3/5</Docs.Code>, <Docs.Code>4/5</Docs.Code>.
          </Docs.Text>
        </>
      ),
    },
    examples.columnWithContentWidth,
    examples.nestedColumns,
    examples.nestedColumnsWithExplicitWidths,
    examples.nestedColumnsWithExplicitWidthsContent,
    examples.centerAlignedVertically,
    examples.bottomAlignedVertically,
    examples.centerAlignedHorizontally,
    examples.rightAlignedHorizontally,
    examples.justifiedHorizontally,
    examples.fullHeightColumnFlexGrow,
    examples.dynamicWidthContent,
  ],
};

export default docs;
