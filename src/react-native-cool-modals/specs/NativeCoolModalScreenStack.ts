import { type ViewProps } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import { type DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';

export interface NativeProps extends ViewProps {
  onFinishTransitioning?: DirectEventHandler<undefined>;
}

export default codegenNativeComponent<NativeProps>('RNCMScreenStack', { excludedPlatforms: ['android'] });
