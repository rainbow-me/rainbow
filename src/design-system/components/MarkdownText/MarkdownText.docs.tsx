/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../playground/Guide' was resolved to '/... Remove this comment to see the full error message
import { Guide } from '../../playground/Guide';
// @ts-expect-error ts-migrate(6142) FIXME: Module './MarkdownText' was resolved to '/Users/ni... Remove this comment to see the full error message
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
  category: 'Content',
  examples: [
    {
      name: 'Basic usage',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <MarkdownText>{markdown}</MarkdownText>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
        </>
      ),
    },

    {
      name: 'Custom space',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <MarkdownText nestedSpace={{ custom: 30 }} space="42px">
            {customSpaceMarkdown}
          </MarkdownText>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Guide />
        </>
      ),
    },
  ],
};

export default docs;
