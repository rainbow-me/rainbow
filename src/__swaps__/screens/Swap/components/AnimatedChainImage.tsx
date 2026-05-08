import { Platform } from 'react-native';

import { AnimatedChainImage as AnimatedChainImageAndroid } from './AnimatedChainImage.android';
import { AnimatedChainImage as AnimatedChainImageIOS } from './AnimatedChainImage.ios';

const componentToExport = Platform.OS === 'ios' ? AnimatedChainImageIOS : AnimatedChainImageAndroid;

export { componentToExport as AnimatedChainImage };
