import { codegenNativeComponent, type CodegenTypes, type ViewProps } from 'react-native';

export interface NativeProps extends ViewProps {
  onFinishTransitioning?: CodegenTypes.DirectEventHandler<undefined>;
}

export default codegenNativeComponent<NativeProps>('RNCMScreenStack', { excludedPlatforms: ['android'] });
