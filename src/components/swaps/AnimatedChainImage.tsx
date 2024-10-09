import { AnimatedChainImage as AnimatedChainImageIOS } from './AnimatedChainImage.ios';
import { AnimatedChainImage as AnimatedChainImageAndroid } from './AnimatedChainImage.android';
import { IS_IOS } from '@/env';

const componentToExport = IS_IOS ? AnimatedChainImageIOS : AnimatedChainImageAndroid;

export { componentToExport as AnimatedChainImage };
