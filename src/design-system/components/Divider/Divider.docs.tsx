/* eslint-disable sort-keys-fix/sort-keys-fix */
import { Docs } from '../../docs/types';

import * as examples from './Divider.examples';
import meta from './Divider.meta';

const docs: Docs = {
  meta,
  examples: [
    examples.basicUsage,
    examples.divider80,
    examples.divider60,
    examples.divider40,
    examples.divider20,
    examples.vertical,
  ],
};

export default docs;
