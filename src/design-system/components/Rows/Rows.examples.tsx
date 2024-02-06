import * as React from 'react';

import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Box } from '../Box/Box';
import { Row, Rows } from './Rows';
import { ReactNode } from 'react';

export const basicUsage: Example = {
  name: 'Basic usage',
  wrapper: (children: ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows space="20px">
        <Placeholder height="100%" />
        <Placeholder height="100%" />
        <Placeholder height="100%" />
      </Rows>
    ),
};

export const customSpace: Example = {
  name: 'Custom space',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows space={{ custom: 10 }}>
        <Placeholder height="100%" />
        <Placeholder height="100%" />
        <Placeholder height="100%" />
      </Rows>
    ),
};

export const customHeights: Example = {
  name: 'Custom heights',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows space="20px">
        <Row height="1/4">
          <Placeholder height="100%" />
        </Row>
        <Row height="3/4">
          <Placeholder height="100%" />
        </Row>
      </Rows>
    ),
};

export const rowWithContentHeight: Example = {
  name: 'Row with content height',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows space="12px">
        <Placeholder height="100%" />
        <Row height="content">
          <Placeholder />
        </Row>
      </Rows>
    ),
};

export const nestedRows: Example = {
  name: 'Nested rows',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows space="12px">
        <Placeholder height="100%" />
        <Rows space="3px">
          <Placeholder height="100%" />
          <Placeholder height="100%" />
        </Rows>
      </Rows>
    ),
};

export const nestedRowsWithExplicitHeights: Example = {
  name: 'Nested rows with explicit heights',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows space="12px">
        <Placeholder height="100%" />
        <Rows space="12px">
          <Row height="1/3">
            <Placeholder height="100%" />
          </Row>
          <Placeholder height="100%" />
        </Rows>
      </Rows>
    ),
};

export const nestedRowsWithExplicitHeightsContent: Example = {
  name: 'Nested rows with explicit heights (content)',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows space="20px">
        <Placeholder height="100%" />
        <Row height="content">
          <Rows space="6px">
            <Row height="content">
              <Placeholder height={60} />
            </Row>
            <Row height="content">
              <Placeholder height={60} />
            </Row>
          </Rows>
        </Row>
      </Rows>
    ),
};

export const centerAlignedVertically: Example = {
  name: 'Center-aligned vertically',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 300 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows alignVertical="center" space="20px">
        <Row height="1/2">
          <Placeholder height="100%" />
        </Row>
        <Row height="1/4">
          <Placeholder height="100%" />
        </Row>
      </Rows>
    ),
};

export const bottomAlignedVertically: Example = {
  name: 'Bottom-aligned vertically',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 300 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows alignVertical="bottom" space="20px">
        <Row height="1/2">
          <Placeholder height="100%" />
        </Row>
        <Row height="1/4">
          <Placeholder height="100%" />
        </Row>
      </Rows>
    ),
};

export const centerAlignedHorizontally: Example = {
  name: 'Center-aligned horizontally',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows alignHorizontal="center" space="20px">
        <Placeholder height="100%" width={30} />
        <Placeholder height="100%" width={60} />
        <Placeholder height="100%" width={20} />
      </Rows>
    ),
};

export const rightAlignedHorizontally: Example = {
  name: 'Right-aligned horizontally',
  wrapper: (children: React.ReactNode) => <Box height={{ custom: 200 }}>{children}</Box>,
  Example: () =>
    source(
      <Rows alignHorizontal="right" space="20px">
        <Placeholder height="100%" width={30} />
        <Placeholder height="100%" width={60} />
        <Placeholder height="100%" width={20} />
      </Rows>
    ),
};
