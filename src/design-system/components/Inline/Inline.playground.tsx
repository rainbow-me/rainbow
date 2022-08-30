import { Playground } from '../../docs/types';
import * as examples from './Inline.examples';
import meta from './Inline.meta';

const playground: Playground = {
  meta,
  examples: [
    examples.basicUsage,
    examples.noWrap,
    examples.customSpace,
    examples.differentSpaceOnAxis,
    examples.customSpaceOnAxis,
    examples.centerAlignedHorizontally,
    examples.rightAlignedHorizontally,
    examples.justifiedHorizontally,
    examples.centerAlignedVertically,
    examples.bottomAlignedVertically,
    examples.centerAlignedHorizontallyVertically,
    examples.fixedHeightSeparators,
    examples.fixedHeightSeparatorsHorizontalAlignment,
    examples.fixedHeightSeparatorsVerticalAlignment,
    examples.fullHeightSeparators,
    examples.noSpaceAndSeparators,
  ],
};

export default playground;
