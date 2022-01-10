/* eslint-disable sort-keys-fix/sort-keys-fix */
import { Playground } from '../../docs/types';
import * as examples from './Inline.examples';
import meta from './Inline.meta';

const playground: Playground = {
  meta,
  examples: [
    examples.basicUsage,
    examples.customSpace,
    examples.differentSpaceOnAxis,
    examples.customSpaceOnAxis,
    examples.centerAlignedHorizontally,
    examples.rightAlignedHorizontally,
    examples.centerAlignedVertically,
    examples.bottomAlignedVertically,
    examples.centerAlignedHorizontallyVertically,
  ],
};

export default playground;
