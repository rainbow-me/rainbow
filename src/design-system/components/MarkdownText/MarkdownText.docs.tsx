/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
import { Guide } from '../../playground/Guide';
import { MarkdownText } from './MarkdownText';

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const markdown = `
  # Heading 1

  ## Heading 2

  ### Heading 3

  #### Heading 4

  ##### Heading 5

  ###### Heading 6

  Paragraph. ${loremIpsum}

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

  ${loremIpsum}

  - Bullet list

    ${loremIpsum}

  - Bullet list

    ${loremIpsum}

  - Bullet list

    ${loremIpsum}
`;

const docs: Docs = {
  name: 'MarkdownText',
  examples: [
    {
      name: 'Basic usage',
      example: (
        <>
          <Guide />
          <MarkdownText>{markdown}</MarkdownText>
          <Guide />
        </>
      ),
    },

    {
      name: 'Custom space',
      example: (
        <>
          <Guide />
          <MarkdownText nestedSpace="30dp" space="42dp">
            {customSpaceMarkdown}
          </MarkdownText>
          <Guide />
        </>
      ),
    },
  ],
};

export default docs;
