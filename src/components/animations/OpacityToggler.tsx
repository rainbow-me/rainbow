import React from 'react';
import { View, ViewProps } from 'react-native';

type OpacityTogglerProps = {
  endingOpacity?: number;
  isVisible: boolean;
  style?: ViewProps['style'];
} & Omit<ViewProps, 'style'>;

const OpacityToggler = ({ endingOpacity = 0, isVisible, style, ...props }: OpacityTogglerProps, ref: React.Ref<View>) => {
  const opacity = isVisible ? endingOpacity : 1;
  return <View {...props} accessible ref={ref} style={[style, { opacity }]} />;
};

export default React.forwardRef<View, OpacityTogglerProps>(OpacityToggler);
