import { type ViewProps } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import { type WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

export interface NativeProps extends ViewProps {
  blockTouches?: WithDefault<boolean, false>;
}

export default codegenNativeComponent<NativeProps>('WindowPortal', { excludedPlatforms: ['android'] });
