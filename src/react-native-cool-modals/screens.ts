import { requireNativeComponent, type ViewProps } from 'react-native';

import { type NativeScreenProps } from './types';

export const NativeScreen = requireNativeComponent<NativeScreenProps>('RNCMScreen');
export const NativeScreenStack = requireNativeComponent<ViewProps>('RNCMScreenStack');
