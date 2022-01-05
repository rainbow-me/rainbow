import React from 'react';
import { Box } from '../components/Box/Box';
import { Text } from '../components/Text/Text';
import * as Docs from '../docs/components';
import { Docs as DocsType } from '../docs/types';
import source from '../docs/utils/source.macro';

const docs: DocsType = {
  category: 'Color',
  description: (
    <>
      <Docs.Text>
        Color is modeled based on why something should be a certain color,
        defined with semantic names that allow them to adjust based on context.
        This makes it trivial to re-use components in different environments
        without having to manually adjust foreground colors.
      </Docs.Text>
      <Docs.Text>
        For example, let&apos;s assume we have the following piece of text:
      </Docs.Text>
      <Docs.CodePreview
        Example={() => source(<Text color="secondary50">Lorem ipsum</Text>)}
        disableActions
        showCode
      />
      <Docs.Text>
        By default, this text will either be dark or light based on whether the
        app is in light mode or dark mode.
      </Docs.Text>
      <Docs.Text>
        Now, imagine that this text was nested inside of a dark container across
        both light and dark modes:
      </Docs.Text>
      <Docs.CodePreview
        Example={() =>
          source(
            <>
              <Box background="swap" padding="19px">
                <Text color="secondary50">Lorem ipsum</Text>
              </Box>
              <Box background="action" padding="19px">
                <Text color="secondary50">Lorem ipsum</Text>
              </Box>
            </>
          )
        }
        disableActions
        showCode
      />
      <Docs.Text>
        Typically in this scenario we&apos;d need to alter the text color so
        that it has sufficient contrast against the background. However, when
        setting a background with <Docs.Code>Box</Docs.Code>, the color mode is
        automatically configured for nested elements based on whether the
        background is dark or light, meaning that foreground colors usually
        won&apos;t need to be changed.
      </Docs.Text>
    </>
  ),
  name: 'Introduction',
};

export default docs;
