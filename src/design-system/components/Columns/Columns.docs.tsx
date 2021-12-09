/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import * as Docs from '../../docs/components';
import { Docs as DocsType } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Placeholder } from '../../playground/Placeholder';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Column, Columns } from './Columns';

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const docs: DocsType = {
  name: 'Columns',
  category: 'Layout',
  description: (
    <Stack space="24px">
      <Docs.Text>
        Renders children <Docs.Strong>horizontally</Docs.Strong> in equal-width
        columns by default, with consistent spacing between them.
      </Docs.Text>
      <Docs.Text>
        If there is only a single column, no space will be rendered.
      </Docs.Text>
    </Stack>
  ),
  examples: [
    {
      name: 'Basic usage',
      Example: () =>
        source(
          <Columns space="19px">
            <Placeholder />
            <Placeholder />
          </Columns>
        ),
    },

    {
      name: 'Custom space',
      Example: () =>
        source(
          <Columns space={{ custom: 7 }}>
            <Placeholder />
            <Placeholder />
          </Columns>
        ),
    },

    {
      name: 'Custom widths',
      description: (
        <Stack space="24px">
          <Docs.Text>
            You can optionally control column widths by manually rendering a{' '}
            <Docs.Code>Column</Docs.Code> as a direct child of{' '}
            <Docs.Code>Columns</Docs.Code>, which allows you to set an explicit{' '}
            <Docs.Code>width</Docs.Code> prop.
          </Docs.Text>
          <Docs.Text>
            A common usage of this is to make a column shrink to the width of
            its content. This can be achieved by setting the column{' '}
            <Docs.Code>width</Docs.Code> prop to{' '}
            <Docs.Code>&quot;content&quot;</Docs.Code>. Any columns without an
            explicit width will share the remaining space equally.
          </Docs.Text>
          <Docs.Text>
            The following fractional widths are also available:{' '}
            <Docs.Code>1/2</Docs.Code>, <Docs.Code>1/3</Docs.Code>,{' '}
            <Docs.Code>2/3</Docs.Code>, <Docs.Code>1/4</Docs.Code>,{' '}
            <Docs.Code>3/4</Docs.Code>, <Docs.Code>1/5</Docs.Code>,{' '}
            <Docs.Code>2/5</Docs.Code>, <Docs.Code>3/5</Docs.Code>,{' '}
            <Docs.Code>4/5</Docs.Code>.
          </Docs.Text>
        </Stack>
      ),
      Example: () =>
        source(
          <Stack space="19px">
            <Columns space="19px">
              <Column width="1/2">
                <Placeholder />
              </Column>
              <Column width="1/2">
                <Placeholder />
              </Column>
            </Columns>

            <Columns space="19px">
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

            <Columns space="19px">
              <Column width="2/3">
                <Placeholder />
              </Column>
              <Column width="1/3">
                <Placeholder />
              </Column>
            </Columns>

            <Columns space="19px">
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

            <Columns space="19px">
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

            <Columns space="19px">
              <Column width="1/4">
                <Placeholder />
              </Column>
              <Column width="3/4">
                <Placeholder />
              </Column>
            </Columns>

            <Columns space="19px">
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

            <Columns space="19px">
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

            <Columns space="19px">
              <Column width="1/5">
                <Placeholder />
              </Column>
              <Column width="4/5">
                <Placeholder />
              </Column>
            </Columns>
          </Stack>
        ),
    },

    {
      name: 'Column with content width',
      Example: () =>
        source(
          <Columns space="19px">
            <Placeholder />
            <Column width="content">
              <Placeholder width={100} />
            </Column>
          </Columns>
        ),
    },

    {
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
    },

    {
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
    },

    {
      name: 'Nested columns with explicit widths (content)',
      Example: () =>
        source(
          <Columns space="19px">
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
    },

    {
      name: 'Center-aligned vertically',
      Example: () =>
        source(
          <Columns alignVertical="center" space="19px">
            <Placeholder height={30} />
            <Placeholder height={60} />
            <Placeholder height={20} />
          </Columns>
        ),
    },

    {
      name: 'Bottom-aligned vertically',
      Example: () =>
        source(
          <Columns alignVertical="bottom" space="19px">
            <Placeholder height={30} />
            <Placeholder height={60} />
            <Placeholder height={20} />
          </Columns>
        ),
    },

    {
      name: 'Center-aligned horizontally',
      description: (
        <Stack space="24px">
          <Text>
            Columns can optionally be aligned horizontally and/or vertically,
            but note that this only affects the column containers themselves,
            not the content within them.
          </Text>
          <Text>
            To align content within a column, you&apos;ll need to nest another
            layout component inside it, such as a <Docs.Code>Stack</Docs.Code>{' '}
            with <Docs.Code>alignHorizontal</Docs.Code>.
          </Text>
        </Stack>
      ),
      Example: () =>
        source(
          <Columns alignHorizontal="center" space="19px">
            <Column width="1/4">
              <Placeholder height={30} />
            </Column>
            <Column width="1/4">
              <Placeholder height={60} />
            </Column>
          </Columns>
        ),
    },

    {
      name: 'Right-aligned horizontally',
      Example: () =>
        source(
          <Columns alignHorizontal="right" space="19px">
            <Column width="1/4">
              <Placeholder height={30} />
            </Column>
            <Column width="1/4">
              <Placeholder height={60} />
            </Column>
          </Columns>
        ),
    },

    {
      name: 'Justified horizontally',
      Example: () =>
        source(
          <Columns alignHorizontal="justify" space="19px">
            <Column width="1/4">
              <Placeholder height={30} />
            </Column>
            <Column width="1/4">
              <Placeholder height={60} />
            </Column>
          </Columns>
        ),
    },

    {
      name: 'Full-height column via flexGrow',
      Example: () =>
        source(
          <Columns alignVertical="bottom" space="30px">
            <Placeholder flexGrow={1} />
            <Placeholder height={30} />
            <Placeholder height={100} />
            <Placeholder height={60} />
          </Columns>
        ),
    },

    {
      name: 'Dynamic width content',
      Example: () =>
        source(
          <Columns space="19px">
            <Text>Lorem</Text>
            <Text>{loremIpsum}</Text>
          </Columns>
        ),
    },
  ],
};

export default docs;
