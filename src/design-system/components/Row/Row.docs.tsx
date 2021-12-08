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
      Example: () => (
        <Row space="19px">
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Custom space',
      Example: () => (
        <Row space={{ custom: 9 }}>
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Center-aligned horizontally',
      Example: () => (
        <Row alignHorizontal="center" space="19px">
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Right-aligned horizontally',
      Example: () => (
        <Row alignHorizontal="right" space="19px">
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Justified horizontally',
      Example: () => (
        <Row alignHorizontal="justify" space="19px">
          <Placeholder width={40} />
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Row>
      ),
    },

    {
      name: 'Center-aligned vertically',
      Example: () => (
        <Row alignVertical="center" space="19px">
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={20} width={40} />
        </Row>
      ),
    },

    {
      name: 'Bottom-aligned vertically',
      Example: () => (
        <Row alignVertical="bottom" space="19px">
          <Placeholder height={40} width={40} />
          <Placeholder height={60} width={40} />
          <Placeholder height={20} width={40} />
        </Row>
      ),
    },

    {
      name: 'With fixed-height separators',
      Example: () => (
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
      Example: () => (
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
      Example: () => (
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
      Example: () => (
        <Row
          alignVertical="center"
          separator={
            <View style={{ backgroundColor: '#999', flexGrow: 1, width: 1 }} />
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
      Example: () => (
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
