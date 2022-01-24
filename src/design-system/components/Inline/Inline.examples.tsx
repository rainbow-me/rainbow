/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inline } from './Inline';

export const basicUsage: Example = {
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
};

export const customSpace: Example = {
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
};

export const differentSpaceOnAxis: Example = {
  name: 'Different space on each axis',
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
};

export const customSpaceOnAxis: Example = {
  name: 'Custom space on each axis',
  Example: () =>
    source(
      <Inline horizontalSpace={{ custom: 17 }} verticalSpace={{ custom: 8 }}>
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
};

export const centerAlignedHorizontally: Example = {
  name: 'Center-aligned horizontally',
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
};

export const rightAlignedHorizontally: Example = {
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
};

export const centerAlignedVertically: Example = {
  name: 'Center-aligned vertically',
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
};

export const bottomAlignedVertically: Example = {
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
};

export const centerAlignedHorizontallyVertically: Example = {
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
};
