import { Playground } from '../../docs/types';
import * as examples from './Text.examples';
import meta from './Text.meta';

const playground: Playground = {
  meta,
  examples: [...examples.sizes, examples.withColor, examples.withEmoji, examples.withTruncation, examples.withWeight],
};

export default playground;
