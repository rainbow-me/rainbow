import { type ViewProps, codegenNativeComponent, type CodegenTypes } from 'react-native';

export interface NativeProps extends ViewProps {
  blockTouches?: CodegenTypes.WithDefault<boolean, false>;
}

export default codegenNativeComponent<NativeProps>('WindowPortal', { excludedPlatforms: ['android'] });
