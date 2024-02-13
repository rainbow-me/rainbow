import { Playground } from '../../docs/types';
import * as examples from './BackgroundProvider.examples';
import meta from './BackgroundProvider.meta';

const playground: Playground = {
  meta,
  examples: [examples.standardBackgrounds, examples.customAccentColorDark, examples.customAccentColorLight],
};

export default playground;
