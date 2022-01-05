/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inline } from './Inline';

const docs: DocsType = {
  name: 'Inline',
  category: 'Layout',
  description: (
    <>
      <Docs.Text>
        Arranges child nodes{' '}
        <Docs.Strong>
          horizontally, wrapping to multiple lines if needed
        </Docs.Strong>
        , with equal spacing between items.
      </Docs.Text>
      <Docs.Text>
        If there is only a single child node, no space will be rendered.
      </Docs.Text>
    </>
  ),
  examples: [
    {
      name: 'Basic usage',
      Example: () =>
        source(
          <Inline space="12px">
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
          </Inline>
        ),
    },

    {
      name: 'Custom space',
      Example: () =>
        source(
          <Inline space={{ custom: 8 }}>
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
          </Inline>
        ),
    },

    {
      name: 'Different space on each axis',
      description: (
        <Docs.Text>Space can also be customized per axis.</Docs.Text>
      ),
      Example: () =>
        source(
          <Inline horizontalSpace="19px" verticalSpace="12px">
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
          </Inline>
        ),
    },

    {
      name: 'Custom space on each axis',
      Example: () =>
        source(
          <Inline
            horizontalSpace={{ custom: 17 }}
            verticalSpace={{ custom: 8 }}
          >
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
          </Inline>
        ),
    },

    {
      name: 'Center-aligned horizontally',
      description: (
        <Docs.Text>
          To align content horizontally within the component, use the{' '}
          <Docs.Code>alignHorizontal</Docs.Code> prop.
        </Docs.Text>
      ),
      Example: () =>
        source(
          <Inline alignHorizontal="center" space="19px">
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
          </Inline>
        ),
    },

    {
      name: 'Right-aligned horizontally',
      Example: () =>
        source(
          <Inline alignHorizontal="right" space="19px">
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={40} width={40} />
          </Inline>
        ),
    },
    {
      name: 'Center-aligned vertically',
      description: (
        <Docs.Text>
          To align content vertically within the component, use the{' '}
          <Docs.Code>alignVertical</Docs.Code> prop.
        </Docs.Text>
      ),
      Example: () =>
        source(
          <Inline alignVertical="center" space="19px">
            <Placeholder height={20} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={60} width={40} />
            <Placeholder height={30} width={40} />
            <Placeholder height={50} width={40} />
            <Placeholder height={20} width={40} />
            <Placeholder height={70} width={40} />
            <Placeholder height={10} width={40} />
            <Placeholder height={50} width={40} />
          </Inline>
        ),
    },

    {
      name: 'Bottom-aligned vertically',
      Example: () =>
        source(
          <Inline alignVertical="bottom" space="19px">
            <Placeholder height={20} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={60} width={40} />
            <Placeholder height={30} width={40} />
            <Placeholder height={50} width={40} />
            <Placeholder height={20} width={40} />
            <Placeholder height={70} width={40} />
            <Placeholder height={10} width={40} />
            <Placeholder height={50} width={40} />
          </Inline>
        ),
    },

    {
      name: 'Center-aligned horizontally and vertically',
      Example: () =>
        source(
          <Inline alignHorizontal="center" alignVertical="center" space="19px">
            <Placeholder height={20} width={40} />
            <Placeholder height={40} width={40} />
            <Placeholder height={60} width={40} />
            <Placeholder height={30} width={40} />
            <Placeholder height={50} width={40} />
            <Placeholder height={20} width={40} />
            <Placeholder height={70} width={40} />
            <Placeholder height={10} width={40} />
            <Placeholder height={50} width={40} />
          </Inline>
        ),
    },
  ],
};

export default docs;
