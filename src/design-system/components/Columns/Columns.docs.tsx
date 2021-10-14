/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { View } from 'react-native';
import { Docs } from '../../playground/Docs';
import { Placeholder } from '../../playground/Placeholder';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Column, Columns } from './Columns';

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const docs: Docs = {
  name: 'Columns',
  examples: [
    {
      name: 'Basic usage',
      example: (
        <Columns space="19dp">
          <Placeholder />
          <Placeholder />
          <Placeholder />
        </Columns>
      ),
    },

    {
      name: 'Custom widths',
      example: (
        <Stack space="19dp">
          <Columns space="19dp">
            <Column width="1/2">
              <Placeholder />
            </Column>
            <Column width="1/2">
              <Placeholder />
            </Column>
          </Columns>

          <Columns space="19dp">
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

          <Columns space="19dp">
            <Column width="2/3">
              <Placeholder />
            </Column>
            <Column width="1/3">
              <Placeholder />
            </Column>
          </Columns>

          <Columns space="19dp">
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

          <Columns space="19dp">
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

          <Columns space="19dp">
            <Column width="1/4">
              <Placeholder />
            </Column>
            <Column width="3/4">
              <Placeholder />
            </Column>
          </Columns>

          <Columns space="19dp">
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

          <Columns space="19dp">
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

          <Columns space="19dp">
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
      name: 'Custom width (content)',
      example: (
        <Columns space="19dp">
          <Placeholder />
          <Column width="content">
            <Placeholder width={100} />
          </Column>
        </Columns>
      ),
    },

    {
      name: 'Nested columns',
      example: (
        <Columns space="12dp">
          <Placeholder />
          <Columns space="12dp">
            <Placeholder />
            <Placeholder />
          </Columns>
        </Columns>
      ),
    },

    {
      name: 'Nested columns with explicit widths',
      example: (
        <Columns space="12dp">
          <Placeholder />
          <Columns space="12dp">
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
      example: (
        <Columns space="19dp">
          <Placeholder />
          <Column width="content">
            <Columns space="6dp">
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
      example: (
        <Columns alignVertical="center" space="19dp">
          <Placeholder height={30} />
          <Placeholder height={60} />
          <Placeholder height={20} />
        </Columns>
      ),
    },

    {
      name: 'Bottom-aligned vertically',
      example: (
        <Columns alignVertical="bottom" space="19dp">
          <Placeholder height={30} />
          <Placeholder height={60} />
          <Placeholder height={20} />
        </Columns>
      ),
    },

    {
      name: 'Center-aligned horizontally',
      example: (
        <Columns alignHorizontal="center" space="19dp">
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
      example: (
        <Columns alignHorizontal="right" space="19dp">
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
      example: (
        <Columns alignHorizontal="justify" space="19dp">
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
      example: (
        <Columns alignVertical="bottom" space="30dp">
          <Placeholder flexGrow={1} />
          <Placeholder height={30} />
          <Placeholder height={100} />
          <Placeholder height={60} />
        </Columns>
      ),
    },

    {
      name: 'Dynamic width content',
      example: (
        <Columns space="19dp">
          <Text>Lorem</Text>
          <Text>{loremIpsum}</Text>
        </Columns>
      ),
    },

    {
      name: 'Content overflowing column',
      example: (
        <Columns space="19dp">
          <Placeholder width={200} />
          <Placeholder />
          <Placeholder />
        </Columns>
      ),
    },

    {
      name: 'Test bounds',
      example: (
        <View style={{ backgroundColor: 'rgba(255,0,0,0.1)' }}>
          <Columns space="19dp">
            <Placeholder />
            <Placeholder />
            <Placeholder />
          </Columns>
        </View>
      ),
    },
  ],
};

export default docs;
