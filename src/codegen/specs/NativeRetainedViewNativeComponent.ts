import { codegenNativeComponent, type ViewProps } from 'react-native';

// Codegen requires component props to be declared as an interface.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('RetainedView', {
  excludedPlatforms: ['android'],
});
