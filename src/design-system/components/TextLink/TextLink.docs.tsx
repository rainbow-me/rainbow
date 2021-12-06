/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Text/Text' was resolved to '/Users/nick... Remove this comment to see the full error message
import { Text } from '../Text/Text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './TextLink' was resolved to '/Users/nickby... Remove this comment to see the full error message
import { TextLink } from './TextLink';

const docs: Docs = {
  name: 'TextLink',
  category: 'Content',
  examples: [
    {
      name: 'Basic usage',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Text>
          This text contains a // @ts-expect-error ts-migrate(17004) FIXME:
          Cannot use JSX unless the '--jsx' flag is provided... Remove this
          comment to see the full error message
          <TextLink url="https://rainbow.me">link</TextLink>
        </Text>
      ),
    },
  ],
};

export default docs;
