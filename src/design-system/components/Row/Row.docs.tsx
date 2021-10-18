/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Row } from './Row';

const docs: Docs = {
  name: 'Row',
  category: 'Layout',
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
      name: 'With fixed-height separators',
      example: (
        <Row
          separator={
            <View style={{ backgroundColor: '#999', height: 20, width: 1 }} />
          }
          space="19dp"
        >
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'With fixed-height separators and vertical alignment',
      example: (
        <Row
          alignVertical="center"
          separator={
            <View style={{ backgroundColor: '#999', height: 20, width: 1 }} />
          }
          space="19dp"
        >
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={20} width={40} />
        </Row>
      ),
    },

    {
      name: 'With fixed-height separators and horizontal alignment',
      example: (
        <Row
          alignHorizontal="center"
          separator={
            <View style={{ backgroundColor: '#999', height: 20, width: 1 }} />
          }
          space="19dp"
        >
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'With full-height separators',
      example: (
        <Row
          alignVertical="center"
          separator={
            <View style={{ backgroundColor: '#999', flexGrow: 1, width: 1 }} />
          }
          space="19dp"
        >
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={20} width={40} />
        </Row>
      ),
    },

    {
      name: 'With no space and separators',
      example: (
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
