/* eslint-disable sort-keys-fix/sort-keys-fix */
import React from 'react';
import { Docs } from '../../playground/Docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../playground/Placeholder' was resolved... Remove this comment to see the full error message
import { Placeholder } from '../../playground/Placeholder';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Inset' was resolved to '/Users/nickbytes... Remove this comment to see the full error message
import { Inset } from './Inset';

const docs: Docs = {
  name: 'Inset',
  category: 'Layout',
  examples: [
    {
      name: 'Basic usage',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Inset space="19px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Placeholder height={100} />
        </Inset>
      ),
    },

    {
      name: 'Custom space',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Inset space={{ custom: 12 }}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Placeholder height={100} />
        </Inset>
      ),
    },

    {
      name: 'Horizontal space',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Inset horizontal="19px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Placeholder height={100} />
        </Inset>
      ),
    },

    {
      name: 'Vertical space',
      Example: () => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Inset vertical="19px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Placeholder height={100} />
        </Inset>
      ),
    },
  ],
};

export default docs;
