/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Text } from '../Text/Text';
import { Row } from './Row';

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const docs: Docs = {
  name: 'Row',
  examples: [
    {
      name: 'Basic usage',
      example: (
        <Row space="19dp">
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Center-aligned horizontally',
      example: (
        <Row alignHorizontal="center" space="19dp">
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Right-aligned horizontally',
      example: (
        <Row alignHorizontal="right" space="19dp">
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Justified horizontally',
      example: (
        <Row alignHorizontal="justify" space="19dp">
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Center-aligned vertically',
      example: (
        <Row alignVertical="center" space="19dp">
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={20} width={40} />
        </Row>
      ),
    },

    {
      name: 'Bottom-aligned vertically',
      example: (
        <Row alignVertical="bottom" space="19dp">
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={20} width={40} />
        </Row>
      ),
    },

    {
      name: 'With text and placeholder',
      example: (
        <Row alignHorizontal="justify" alignVertical="center" space="19dp">
          <Text>Lorem ipsum</Text>
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'With text and multiple placeholders',
      example: (
        <Row alignHorizontal="justify" alignVertical="center" space="19dp">
          <Text>Lorem ipsum</Text>
          <Row space="12dp">
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        </Row>
      ),
    },

    {
      name: 'With paragraph and placeholder',
      example: (
        <Row alignHorizontal="justify" alignVertical="center" space="19dp">
          <Text>{loremIpsum}</Text>
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'With paragraph and multiple placeholders',
      example: (
        <Row alignHorizontal="justify" alignVertical="center" space="19dp">
          <Text>{loremIpsum}</Text>
          <Row space="12dp">
            <Placeholder width={40} />
            <Placeholder width={40} />
            <Placeholder width={40} />
          </Row>
        </Row>
      ),
    },

    {
      name: 'With only text',
      example: (
        <Row alignVertical="center" space="19dp">
          <Text>{loremIpsum}</Text>
          <Text>{loremIpsum}</Text>
        </Row>
      ),
    },
  ],
};

export default docs;
