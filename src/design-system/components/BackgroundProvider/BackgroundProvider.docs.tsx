import { Docs } from '../../docs/types';

import * as examples from './BackgroundProvider.examples';
import meta from './BackgroundProvider.meta';

const docs: Docs = {
  meta,
  examples: [examples.standardBackgrounds, examples.customAccentColorDark, examples.customAccentColorLight],
};

export default docs;
