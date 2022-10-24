import { requireNativeComponent, StyleProp, ViewStyle } from 'react-native';

type Props = {
  style: StyleProp<ViewStyle>;
};

const PanModalScreenStackNativeComponent = requireNativeComponent<Props>(
  'RNCMScreenStack'
);

export default PanModalScreenStackNativeComponent;
