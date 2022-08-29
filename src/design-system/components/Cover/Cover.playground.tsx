import { Playground } from '../../docs/types';
import * as examples from './Cover.examples';
import meta from './Cover.meta';

const playground: Playground = {
  meta,
  examples: [
    examples.basicUsage,
    examples.centerAlignedHorizontally,
    examples.rightAlignedHorizontally,
    examples.justifiedHorizontally,
    examples.centerAlignedVertically,
    examples.bottomAlignedVertically,
  ],
};

export default playground;
