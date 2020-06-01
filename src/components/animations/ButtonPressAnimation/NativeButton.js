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
    {/*
      👆️ This wrapper view is necessary for NativeButton's flexbox functionality to work as
      flexbox everywhere else
    */}
    <Button
      {...props}
      css={
        transformOrigin ? `${transformOrigin}: -50%` : ''
        // 👆️ Here we want to translate the button -50% (relative to the parent wrapper view)
        // so that we can use the `transformOrigin` prop with NativeButton without effecting
        // layout.
      }
      ref={ref}
      transformOrigin={normalizeTransformOrigin(transformOrigin)}
    />
  </View>
);

export default React.forwardRef(NativeButton);
