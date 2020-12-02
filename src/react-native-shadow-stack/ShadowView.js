import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Shadow } from 'react-native-neomorph-shadows';

const ShadowView = props => {
  if (ios || props.elevation > 0) {
    return <View {...props} />;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const newStyle = useMemo(() => {
    const style = StyleSheet.flatten(props.style);
    return {
      ...style,
      ...(style.height !== undefined && { height: style.height - 1 }),
      ...(style.width !== undefined && { width: style.width - 1 }),
      transform: [{ translateX: 0.5 }, { translateY: 0.5 }],
    };
  }, [props.style]);
  return <Shadow {...props} style={newStyle} useArt />;
};

export default ShadowView;
