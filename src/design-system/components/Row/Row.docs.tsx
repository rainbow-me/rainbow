/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import * as examples from './Row.examples';
import meta from './Row.meta';

const docs: DocsType = {
  meta,
  description: (
    <>
      <Docs.Text>
        Arranges child nodes{' '}
        <Docs.Strong>horizontally without wrapping</Docs.Strong>, with equal
        spacing between them, plus an optional <Docs.Code>separator</Docs.Code>{' '}
        element. Items can be aligned with{' '}
        <Docs.Code>alignHorizontal</Docs.Code> and{' '}
        <Docs.Code>alignVertical</Docs.Code>.
      </Docs.Text>
      <Docs.Text>
        If there is only a single child node, no space or separators will be
        rendered.
      </Docs.Text>
    </>
  ),
  examples: [
    examples.basicUsage,
    examples.customSpace,
    examples.centerAlignedHorizontally,
    examples.rightAlignedHorizontally,
    examples.justifiedHorizontally,
    examples.centerAlignedVertically,
    examples.bottomAlignedVertically,
    examples.fixedHeightSeparators,
    examples.fixedHeightSeparatorsVerticalAlignment,
    examples.fixedHeightSeparatorsHorizontalAlignment,
    examples.fullHeightSeparators,
    examples.noSpaceAndSeparators,
  ],
};

export default docs;
