/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Row } from './Row';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Row space="19px">
        <Placeholder width={40} />
        <Placeholder width={40} />
        <Placeholder width={40} />
      </Row>
    ),
};

export const customSpace: Example = {
  name: 'Custom space',
  Example: () =>
    source(
      <Row space={{ custom: 9 }}>
        <Placeholder width={40} />
        <Placeholder width={40} />
        <Placeholder width={40} />
      </Row>
    ),
};

export const centerAlignedHorizontally: Example = {
  name: 'Center-aligned horizontally',
  Example: () =>
    source(
      <Row alignHorizontal="center" space="19px">
        <Placeholder width={40} />
        <Placeholder width={40} />
        <Placeholder width={40} />
      </Row>
    ),
};

export const rightAlignedHorizontally: Example = {
  name: 'Right-aligned horizontally',
  Example: () =>
    source(
      <Row alignHorizontal="right" space="19px">
        <Placeholder width={40} />
        <Placeholder width={40} />
        <Placeholder width={40} />
      </Row>
    ),
};

export const justifiedHorizontally: Example = {
  name: 'Justified horizontally',
  Example: () =>
    source(
      <Row alignHorizontal="justify" space="19px">
        <Placeholder width={40} />
        <Placeholder width={40} />
        <Placeholder width={40} />
      </Row>
    ),
};

export const centerAlignedVertically: Example = {
  name: 'Center-aligned vertically',
  Example: () =>
    source(
      <Row alignVertical="center" space="19px">
        <Placeholder height={40} width={40} />
        <Placeholder height={60} width={40} />
        <Placeholder height={20} width={40} />
      </Row>
    ),
};

export const bottomAlignedVertically: Example = {
  name: 'Bottom-aligned vertically',
  Example: () =>
    source(
      <Row alignVertical="bottom" space="19px">
        <Placeholder height={40} width={40} />
        <Placeholder height={60} width={40} />
        <Placeholder height={20} width={40} />
      </Row>
    ),
};

export const fixedHeightSeparators: Example = {
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
};

export const fixedHeightSeparatorsVerticalAlignment: Example = {
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
};

export const fixedHeightSeparatorsHorizontalAlignment: Example = {
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
};

export const fullHeightSeparators: Example = {
  name: 'With full-height separators',
  Example: () =>
    source(
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
};

export const noSpaceAndSeparators: Example = {
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
};
