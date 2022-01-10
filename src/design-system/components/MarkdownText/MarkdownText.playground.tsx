/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../docs/types';
import source from '../../docs/utils/source.macro';
import { Guide } from '../../playground/Guide';
import { MarkdownText } from './MarkdownText';

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const headingsAndParagraphMarkdown = `
  # Heading 1

  ## Heading 2

  ### Heading 3

  #### Heading 4

  ##### Heading 5

  ###### Heading 6

  Paragraph. ${loremIpsum}
`;

const markdown = `
  ${headingsAndParagraphMarkdown}

  > Blockquote paragraph. ${loremIpsum}

  Text with **bold words.**

  Text with *italicised words.*

  Text with ~~strikethrough.~~

  Text with a [link.](http://rainbow.me)

  Text with emoji. 🌈🌈🌈

  - Bullet list
  - Bullet list
  - Bullet list with rich content

    ${loremIpsum}

    - Nested bullet list
    - Nested bullet list
    - Nested bullet list

  1. Ordered list
  2. Ordered list
  3. Ordered list with rich content

     ${loremIpsum}

     1. Nested bullet list
     2. Nested bullet list
     3. Nested bullet list

  ---

  11. Ordered list with offset
  12. Ordered list with offset

  Text with inline code. \`<MarkdownText>\`

  \`\`\`
  Multiline code block
  Multiline code block
  Multiline code block
  \`\`\`

  | Table  | Table |
  | ------ | ----------- |
  | Lorem  | ${loremIpsum} |
  | Ipsum  | ${loremIpsum} |
`;

const customSpaceMarkdown = `
  ${loremIpsum}

  - Bullet list

    ${loremIpsum}

  - Bullet list
`;

const docs: Docs = {
  meta: {
    name: 'MarkdownText',
    category: 'Content',
  },
  examples: [
    {
      name: 'Basic usage',
      Example: () =>
        source(
          <>
            <Guide />
            <MarkdownText listSpace="19px" paragraphSpace="30px">
              {markdown}
            </MarkdownText>
            <Guide />
          </>
        ),
    },
    {
      name: 'Custom space',
      Example: () =>
        source(
          <>
            <Guide />
            <MarkdownText listSpace={{ custom: 30 }} paragraphSpace="42px">
              {customSpaceMarkdown}
            </MarkdownText>
            <Guide />
          </>
        ),
    },
    {
      name: 'Custom text color',
      Example: () =>
        source(
          <>
            <Guide />
            <MarkdownText
              color="secondary60"
              listSpace="19px"
              paragraphSpace="30px"
            >
              {headingsAndParagraphMarkdown}
            </MarkdownText>
            <Guide />
          </>
        ),
    },
    {
      name: 'Custom text and heading colors',
      Example: () =>
        source(
          <>
            <Guide />
            <MarkdownText
              color="secondary60"
              heading1Color="primary"
              heading2Color="secondary80"
              listSpace="19px"
              paragraphSpace="30px"
            >
              {headingsAndParagraphMarkdown}
            </MarkdownText>
            <Guide />
          </>
        ),
    },
  ],
};

export default docs;
