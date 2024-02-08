import { Docs } from '../../docs/types';

import * as examples from './Text.examples';
import meta from './Text.meta';

const docs: Docs = {
  meta,
  examples: [...examples.sizes, examples.withColor, examples.withEmoji, examples.withTruncation, examples.withWeight],
};

export default docs;
