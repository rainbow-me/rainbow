/* eslint-disable sort-keys-fix/sort-keys-fix */
import { Playground } from '../../docs/types';
import * as examples from './Row.examples';
import meta from './Row.meta';

const playground: Playground = {
  meta,
  examples: [
    examples.basicUsage,
    examples.customSpace,
    examples.centerAlignedHorizontally,
    examples.rightAlignedHorizontally,
    examples.justifiedHorizontally,
    examples.centerAlignedVertically,
    examples.bottomAlignedVertically,
    examples.fixedHeightSeparators,
    examples.fixedHeightSeparatorsVerticalAlignment,
    examples.fixedHeightSeparatorsHorizontalAlignment,
    examples.fullHeightSeparators,
    examples.noSpaceAndSeparators,
  ],
};

export default playground;
