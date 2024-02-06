import { Playground } from '../../docs/types';
import * as examples from './Heading.examples';
import meta from './Heading.meta';

const docs: Playground = {
  meta,
  examples: [...examples.sizes, examples.withColor, examples.withEmoji, examples.withTruncation],
};

export default docs;
