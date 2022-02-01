/* eslint-disable sort-keys-fix/sort-keys-fix */
import { Playground } from '../../docs/types';
import * as examples from './Divider.examples';
import meta from './Divider.meta';

const docs: Playground = {
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
