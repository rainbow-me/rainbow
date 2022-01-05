/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Row } from './Row';

const docs: DocsType = {
  name: 'Row',
  category: 'Layout',
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
      ,
    </>
  ),
  examples: [
    {
      name: 'Basic usage',
      Example: () =>
        source(
          <Row space="19px">
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        ),
    },

    {
      name: 'Custom space',
      Example: () =>
        source(
          <Row space={{ custom: 9 }}>
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        ),
    },

    {
      name: 'Center-aligned horizontally',
      Example: () =>
        source(
          <Row alignHorizontal="center" space="19px">
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        ),
    },

    {
      name: 'Right-aligned horizontally',
      Example: () =>
        source(
          <Row alignHorizontal="right" space="19px">
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        ),
    },

    {
      name: 'Justified horizontally',
      Example: () =>
        source(
          <Row alignHorizontal="justify" space="19px">
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        ),
    },

    {
      name: 'Center-aligned vertically',
      Example: () =>
        source(
          <Row alignVertical="center" space="19px">
            <Placeholder height={40} width={40} />
            <Placeholder height={60} width={40} />
            <Placeholder height={20} width={40} />
          </Row>
        ),
    },

    {
      name: 'Bottom-aligned vertically',
      Example: () =>
        source(
          <Row alignVertical="bottom" space="19px">
            <Placeholder height={40} width={40} />
            <Placeholder height={60} width={40} />
            <Placeholder height={20} width={40} />
          </Row>
        ),
    },

    {
      name: 'With fixed-height separators',
      Example: () =>
        source(
          <Row
            separator={
              <View style={{ backgroundColor: '#999', height: 20, width: 1 }} />
            }
            space="19px"
          >
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        ),
    },

    {
      name: 'With fixed-height separators and vertical alignment',
      Example: () =>
        source(
          <Row
            alignVertical="center"
            separator={
              <View style={{ backgroundColor: '#999', height: 20, width: 1 }} />
            }
            space="19px"
          >
            <Placeholder height={40} width={40} />
            <Placeholder height={60} width={40} />
            <Placeholder height={20} width={40} />
          </Row>
        ),
    },

    {
      name: 'With fixed-height separators and horizontal alignment',
      Example: () =>
        source(
          <Row
            alignHorizontal="center"
            separator={
              <View style={{ backgroundColor: '#999', height: 20, width: 1 }} />
            }
            space="19px"
          >
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        ),
    },

    {
      name: 'With full-height separators',
      Example: () =>
        source(
          <Row
            alignVertical="center"
            separator={
              <View
                style={{ backgroundColor: '#999', flexGrow: 1, width: 1 }}
              />
            }
            space="19px"
          >
            <Placeholder height={40} width={40} />
            <Placeholder height={60} width={40} />
            <Placeholder height={20} width={40} />
          </Row>
        ),
    },

    {
      name: 'With no space and separators',
      Example: () =>
        source(
          <Row
            alignVertical="center"
            separator={
              <View style={{ backgroundColor: '#999', height: 20, width: 1 }} />
            }
          >
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        ),
    },
  ],
};

export default docs;
