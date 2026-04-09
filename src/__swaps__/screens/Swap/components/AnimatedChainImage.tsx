import { IS_IOS } from '@/env';

import { AnimatedChainImage as AnimatedChainImageAndroid } from './AnimatedChainImage.android';
import { AnimatedChainImage as AnimatedChainImageIOS } from './AnimatedChainImage.ios';

const componentToExport = IS_IOS ? AnimatedChainImageIOS : AnimatedChainImageAndroid;

export { componentToExport as AnimatedChainImage };
