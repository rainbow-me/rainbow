import { Playground } from '../../docs/types';
import * as examples from './Columns.examples';

import meta from './Columns.meta';

const playground: Playground = {
  meta,
  examples: [
    examples.basicUsage,
    examples.customSpace,
    examples.customWidths,
    examples.columnWithContentWidth,
    examples.nestedColumns,
    examples.nestedColumnsWithExplicitWidths,
    examples.nestedColumnsWithExplicitWidthsContent,
    examples.centerAlignedVertically,
    examples.bottomAlignedVertically,
    examples.centerAlignedHorizontally,
    examples.rightAlignedHorizontally,
    examples.justifiedHorizontally,
    examples.fullHeightColumnFlexGrow,
    examples.dynamicWidthContent,
  ],
};

export default playground;
