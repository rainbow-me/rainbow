import React from 'react';
import * as Docs from '../docs/components';
import { Docs as DocsType } from '../docs/types';

const docs: DocsType = {
  meta: {
    category: 'Typography',
    name: 'Introduction',
  },
  description: (
    <>
      <Docs.Text>
        A major problem when trying to build a component system is that{' '}
        <Docs.TextLink href="https://medium.com/microsoft-design/leading-trim-the-future-of-digital-typesetting-d082d84b202">
          native text nodes contain additional space above capital letters and below the baseline.
        </Docs.TextLink>{' '}
        This is completely different to how designers think about typography and ends up creating a lot of extra work during development to
        fix unbalanced spacing.
      </Docs.Text>
      <Docs.Text>
        To correct for this, we use a library called <Docs.TextLink href="https://seek-oss.github.io/capsize">Capsize</Docs.TextLink> (with
        a thin wrapper adapting it to React Native) which applies negative margins above and below text nodes, ensuring that their space in
        the layout is aligned with the actual glyphs on screen.
      </Docs.Text>
      <Docs.Blockquote>
        <Docs.Text>
          Using Capsize in React Native gets us really close, but unfortunately we still see some minor vertical alignment issues, so
          we&apos;re also applying some magic-number corrections for each font size — usually a decimal between 1 and -1. If you have any
          insight into why we need to do this, please let us know 🙏
        </Docs.Text>
      </Docs.Blockquote>
      <Docs.Text>
        Text is handled by the <Docs.Code>Text</Docs.Code> and <Docs.Code>Heading</Docs.Code> components. Both of these components
        optionally support <Docs.Code>size</Docs.Code>, <Docs.Code>weight</Docs.Code> and <Docs.Code>align</Docs.Code> props, while{' '}
        <Docs.Code>Text</Docs.Code> also has props for <Docs.Code>color</Docs.Code>, <Docs.Code>uppercase</Docs.Code> and{' '}
        <Docs.Code>tabularNumbers</Docs.Code>.
      </Docs.Text>
    </>
  ),
};

export default docs;
