import React from 'react';

import { Example } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Column, Columns } from './Columns';

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const basicUsage: Example = {
  name: 'Basic usage',
  Example: () =>
    source(
      <Columns space="20px">
        <Placeholder />
        <Placeholder />
      </Columns>
    ),
};

export const customSpace: Example = {
  name: 'Custom space',
  Example: () =>
    source(
      <Columns space={{ custom: 7 }}>
        <Placeholder />
        <Placeholder />
      </Columns>
    ),
};

export const customWidths: Example = {
  name: 'Custom widths',
  Example: () =>
    source(
      <Stack space="20px">
        <Columns space="20px">
          <Column width="1/2">
            <Placeholder />
          </Column>
          <Column width="1/2">
            <Placeholder />
          </Column>
        </Columns>

        <Columns space="20px">
          <Column width="1/3">
            <Placeholder />
          </Column>
          <Column width="1/3">
            <Placeholder />
          </Column>
          <Column width="1/3">
            <Placeholder />
          </Column>
        </Columns>

        <Columns space="20px">
          <Column width="2/3">
            <Placeholder />
          </Column>
          <Column width="1/3">
            <Placeholder />
          </Column>
        </Columns>

        <Columns space="20px">
          <Column width="1/4">
            <Placeholder />
          </Column>
          <Column width="1/4">
            <Placeholder />
          </Column>
          <Column width="1/4">
            <Placeholder />
          </Column>
          <Column width="1/4">
            <Placeholder />
          </Column>
        </Columns>

        <Columns space="20px">
          <Column width="1/4">
            <Placeholder />
          </Column>
          <Column width="1/2">
            <Placeholder />
          </Column>
          <Column width="1/4">
            <Placeholder />
          </Column>
        </Columns>

        <Columns space="20px">
          <Column width="1/4">
            <Placeholder />
          </Column>
          <Column width="3/4">
            <Placeholder />
          </Column>
        </Columns>

        <Columns space="20px">
          <Column width="1/5">
            <Placeholder />
          </Column>
          <Column width="2/5">
            <Placeholder />
          </Column>
          <Column width="2/5">
            <Placeholder />
          </Column>
        </Columns>

        <Columns space="20px">
          <Column width="1/5">
            <Placeholder />
          </Column>
          <Column width="3/5">
            <Placeholder />
          </Column>
          <Column width="1/5">
            <Placeholder />
          </Column>
        </Columns>

        <Columns space="20px">
          <Column width="1/5">
            <Placeholder />
          </Column>
          <Column width="4/5">
            <Placeholder />
          </Column>
        </Columns>
      </Stack>
    ),
};

export const columnWithContentWidth: Example = {
  name: 'Column with content width',
  Example: () =>
    source(
      <Columns space="20px">
        <Placeholder />
        <Column width="content">
          <Placeholder width={100} />
        </Column>
      </Columns>
    ),
};

export const nestedColumns: Example = {
  name: 'Nested columns',
  Example: () =>
    source(
      <Columns space="12px">
        <Placeholder />
        <Columns space="12px">
          <Placeholder />
          <Placeholder />
        </Columns>
      </Columns>
    ),
};

export const nestedColumnsWithExplicitWidths: Example = {
  name: 'Nested columns with explicit widths',
  Example: () =>
    source(
      <Columns space="12px">
        <Placeholder />
        <Columns space="12px">
          <Column width="1/3">
            <Placeholder />
          </Column>
          <Placeholder />
        </Columns>
      </Columns>
    ),
};

export const nestedColumnsWithExplicitWidthsContent: Example = {
  name: 'Nested columns with explicit widths (content)',
  Example: () =>
    source(
      <Columns space="20px">
        <Placeholder />
        <Column width="content">
          <Columns space="6px">
            <Column width="content">
              <Placeholder width={60} />
            </Column>
            <Column width="content">
              <Placeholder width={60} />
            </Column>
          </Columns>
        </Column>
      </Columns>
    ),
};

export const centerAlignedVertically: Example = {
  name: 'Center-aligned vertically',
  Example: () =>
    source(
      <Columns alignVertical="center" space="20px">
        <Placeholder height={30} />
        <Placeholder height={60} />
        <Placeholder height={20} />
      </Columns>
    ),
};

export const bottomAlignedVertically: Example = {
  name: 'Bottom-aligned vertically',
  Example: () =>
    source(
      <Columns alignVertical="bottom" space="20px">
        <Placeholder height={30} />
        <Placeholder height={60} />
        <Placeholder height={20} />
      </Columns>
    ),
};

export const centerAlignedHorizontally: Example = {
  name: 'Center-aligned horizontally',
  Example: () =>
    source(
      <Columns alignHorizontal="center" space="20px">
        <Column width="1/4">
          <Placeholder height={30} />
        </Column>
        <Column width="1/4">
          <Placeholder height={60} />
        </Column>
      </Columns>
    ),
};

export const rightAlignedHorizontally: Example = {
  name: 'Right-aligned horizontally',
  Example: () =>
    source(
      <Columns alignHorizontal="right" space="20px">
        <Column width="1/4">
          <Placeholder height={30} />
        </Column>
        <Column width="1/4">
          <Placeholder height={60} />
        </Column>
      </Columns>
    ),
};

export const justifiedHorizontally: Example = {
  name: 'Justified horizontally',
  Example: () =>
    source(
      <Columns alignHorizontal="justify" space="20px">
        <Column width="1/4">
          <Placeholder height={30} />
        </Column>
        <Column width="1/4">
          <Placeholder height={60} />
        </Column>
      </Columns>
    ),
};

export const fullHeightColumnFlexGrow: Example = {
  name: 'Full-height column via flexGrow',
  Example: () =>
    source(
      <Columns alignVertical="bottom" space="32px">
        <Placeholder flexGrow={1} />
        <Placeholder height={30} />
        <Placeholder height={100} />
        <Placeholder height={60} />
      </Columns>
    ),
};

export const dynamicWidthContent: Example = {
  name: 'Dynamic width content',
  Example: () =>
    source(
      <Columns space="20px">
        <Text color="label" size="17pt">
          Lorem
        </Text>
        <Text color="label" size="17pt">
          {loremIpsum}
        </Text>
      </Columns>
    ),
};
