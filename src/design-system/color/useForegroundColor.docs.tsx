import React from 'react';

import { Box } from '../components/Box/Box';
import { Text } from '../components/Text/Text';
import * as Docs from '../docs/components';
import { Docs as DocsType } from '../docs/types';
import source from '../docs/utils/source.macro';

import { useForegroundColor } from './useForegroundColor';

const docs: DocsType = {
  meta: {
    category: 'Color',
    name: 'useForegroundColor',
  },
  description: (
    <>
      <Docs.Text>
        Low-level access to the foreground color palette is available via the
        <Docs.Code>useForegroundColor</Docs.Code> Hook. This ensures that you get the correct color palette based on the contextual color
        mode.
      </Docs.Text>
      <Docs.CodePreview
        Example={() =>
          source(
            (() => {
              const borderColor = useForegroundColor('accent');

              return (
                <Box padding="6px" style={{ borderColor, borderWidth: 2 }}>
                  <Text color="accent" size="17pt">
                    Hello world
                  </Text>
                </Box>
              );
            })()
          )
        }
      />
      <Docs.Text>Custom colors can also be passed to this Hook in an object format.</Docs.Text>
      <Docs.CodePreview
        Example={() =>
          source(
            (() => {
              const borderColor = useForegroundColor({
                custom: {
                  dark: 'white',
                  light: 'black',
                },
              });

              return (
                <Box padding="6px" style={{ borderColor, borderWidth: 2 }}>
                  <Text color="accent" size="17pt">
                    Hello world
                  </Text>
                </Box>
              );
            })()
          )
        }
      />
    </>
  ),
};

export default docs;
