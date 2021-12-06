import React from 'react';
import { View } from 'react-native';

const OpacityToggler = (
  { endingOpacity = 0, isVisible, style, ...props }: any,
  ref: any
) => {
  const startingOpacity = 1;

  const opacity = isVisible ? endingOpacity : startingOpacity;

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <View {...props} accessible ref={ref} style={[style, { opacity }]} />;
};

export default React.forwardRef(OpacityToggler);
