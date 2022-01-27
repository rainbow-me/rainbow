/* eslint-disable sort-keys-fix/sort-keys-fix */
import { Playground } from '../../docs/types';

import * as examples from './Box.examples';
import meta from './Box.meta';

const playground: Playground = {
  meta,
  examples: [
    examples.background,
    examples.padding,
    examples.margin,
    examples.borderRadius,
    examples.widths,
    examples.heights,
  ],
};

export default playground;
