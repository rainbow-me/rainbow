import React from 'react';

import { Box } from '../components/Box/Box';
import { Text } from '../components/Text/Text';
import * as Docs from '../docs/components';
import { Docs as DocsType } from '../docs/types';
import source from '../docs/utils/source.macro';

import { AccentColorProvider } from './AccentColorContext';

const docs: DocsType = {
  meta: {
    category: 'Color',
    name: 'AccentColorProvider',
  },
  description: (
    <>
      <Docs.Text>
        The <Docs.Code>&quot;accent&quot;</Docs.Code> color can be configured for entire subtrees of the app. By default, it will resolve to
        a pale blue color.
      </Docs.Text>
      <Docs.CodePreview
        Example={() =>
          source(
            <AccentColorProvider color="#ff0000">
              <Text color="accent" size="17pt">
                Hi Mom!
              </Text>
            </AccentColorProvider>
          )
        }
        disableActions
        showCode
      />
      <Docs.Text>
        <Docs.Code>AccentColorProvider</Docs.Code> also detects whether the specified accent color is light or dark and sets the appropriate
        color mode for you.
      </Docs.Text>
      <Docs.CodePreview
        Example={() =>
          source(
            <AccentColorProvider color="#ff0000">
              <Box background="accent" padding="19px (Deprecated)">
                <Text color="label" size="17pt">
                  This text will be inverted automatically.
                </Text>
              </Box>
            </AccentColorProvider>
          )
        }
        disableActions
        showCode
      />
    </>
  ),
};

export default docs;
