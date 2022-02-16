/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';

import { Box } from '../components/Box/Box';
import * as Docs from '../docs/components';
import { Docs as DocsType } from '../docs/types';
import source from '../docs/utils/source.macro';

import { useBackgroundColor } from './useBackgroundColor';

const docs: DocsType = {
  meta: {
    category: 'Color',
    name: 'useBackgroundColor',
  },
  description: (
    <>
      <Docs.Text>
        Low-level access to the background color palette is available via the
        <Docs.Code>useBackgroundColor</Docs.Code> Hook. This ensures that you
        get the correct color palette based on the contextual color mode.
      </Docs.Text>
      <Docs.CodePreview
        Example={() =>
          source(
            (() => {
              const backgroundColor = useBackgroundColor('body');

              return <Box height="68px" style={{ backgroundColor }} />;
            })()
          )
        }
      />
    </>
  ),
};

export default docs;
