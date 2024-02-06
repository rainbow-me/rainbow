import { Playground } from '../../docs/types';

import * as examples from './Bleed.examples';
import meta from './Bleed.meta';

const playground: Playground = {
  meta,
  examples: [examples.basicUsage, examples.customSpace, examples.left, examples.right, examples.top, examples.bottom],
};

export default playground;
