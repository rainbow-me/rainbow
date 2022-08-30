import { Playground } from '../../docs/types';
import * as examples from './Stack.examples';
import meta from './Stack.meta';

const playground: Playground = {
  meta,
  examples: [
    examples.basicUsage,
    examples.customSpace,
    examples.nested,
    examples.withText,
    examples.withCenterAlignment,
    examples.withSeparators,
    examples.withCenterAlignmentAndDividers,
    examples.withRightAlignmentAndDividers,
    examples.withNoSpaceAndSeparators,
  ],
};

export default playground;
