import React from 'react';
import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Inset } from '../Inset/Inset';
import { Cover } from './Cover';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <>
        <Cover>
          <Placeholder height="100%" width="100%" />
        </Cover>
        <Inset space="10px">
          <Placeholder />
        </Inset>
      </>
    ),
};

export const centerAlignedHorizontally: Example = {
  name: 'Center-aligned horizontally',
  Example: () =>
    source(
      <>
        <Placeholder />
        <Cover alignHorizontal="center">
          <Placeholder width={40} />
        </Cover>
      </>
    ),
};

export const rightAlignedHorizontally: Example = {
  name: 'Right-aligned horizontally',
  Example: () =>
    source(
      <>
        <Placeholder />
        <Cover alignHorizontal="right">
          <Placeholder width={40} />
        </Cover>
      </>
    ),
};

export const justifiedHorizontally: Example = {
  name: 'Justified horizontally',
  Example: () =>
    source(
      <>
        <Placeholder />
        <Cover alignHorizontal="justify">
          <Placeholder width={40} />
          <Placeholder width={40} />
        </Cover>
      </>
    ),
};

export const centerAlignedVertically: Example = {
  name: 'Center-aligned vertically',
  Example: () =>
    source(
      <>
        <Placeholder height={100} />
        <Cover alignVertical="center">
          <Placeholder width={40} />
        </Cover>
      </>
    ),
};

export const bottomAlignedVertically: Example = {
  name: 'Bottom-aligned vertically',
  Example: () =>
    source(
      <>
        <Placeholder height={100} />
        <Cover alignVertical="bottom">
          <Placeholder width={40} />
        </Cover>
      </>
    ),
};
