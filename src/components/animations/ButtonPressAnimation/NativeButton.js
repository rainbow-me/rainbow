import React from 'react';
import { requireNativeComponent, View } from 'react-native';
const Button = requireNativeComponent('Button');

const normalizeTransformOrigin = transformOrigin => {
  if (Array.isArray(transformOrigin) && transformOrigin.length === 2) {
    return transformOrigin;
  }

  switch (transformOrigin) {
    case 'bottom':
      return [0.5, 1];
    case 'left':
      return [0, 0.5];
    case 'right':
      return [1, 0.5];
    case 'top':
      return [0.5, 1];
    default:
      return undefined;
  }
};

const NativeButton = ({ transformOrigin, ...props }, ref) => (
  <View>
    <Button
      {...props}
      css={transformOrigin ? `${transformOrigin}: -50%` : ''}
      ref={ref}
      transformOrigin={normalizeTransformOrigin(transformOrigin)}
    />
  </View>
);

export default React.forwardRef(NativeButton);
