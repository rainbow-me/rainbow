import React from 'react';

import { Box } from '../components/Box/Box';
import { Text } from '../components/Text/Text';
import * as Docs from '../docs/components';
import { Docs as DocsType } from '../docs/types';
import source from '../docs/utils/source.macro';

import { ColorModeProvider } from './ColorMode';

const docs: DocsType = {
  meta: {
    category: 'Color',
    name: 'ColorModeProvider',
  },
  description: (
    <>
      <Docs.Text>
        If you&apos;re rendering a custom background color, you can take control of the color mode by manually rendering a
        ColorModeProvider.
      </Docs.Text>
      <Docs.Text>
        Beyond the usual light and dark modes, there are also lightTinted and darkTinted modes which are designed for non-neutral background
        colors where foreground colors should be desaturated.
      </Docs.Text>
      <Docs.CodePreview
        Example={() =>
          source(
            <>
              <Box padding="24px" style={{ backgroundColor: 'black' }}>
                <ColorModeProvider value="dark">
                  <Text color="label" size="17pt">
                    Hi Mom!
                  </Text>
                </ColorModeProvider>
              </Box>
              <Box padding="24px" style={{ backgroundColor: 'white' }}>
                <ColorModeProvider value="light">
                  <Text color="label" size="17pt">
                    Hi Rainbow!
                  </Text>
                </ColorModeProvider>
              </Box>
            </>
          )
        }
        disableActions
        showCode
      />
    </>
  ),
};

export default docs;
