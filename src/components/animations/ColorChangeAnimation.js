import React, { useState, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { fonts, colors } from '../../styles';

const Switch = ({ valueString }) => {
  const [value] = useState(new Animated.Value(0));

  const color = value.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.blueGreyDark, colors.chartGreen],
  });

  useEffect(() => {
    Animated.timing(value, {
      duration: 120,
      easing: Easing.linear,
      toValue: 1,
    }).start();

    setTimeout(() => {
      Animated.timing(value, {
        duration: 1200,
        easing: Easing.linear,
        toValue: 0,
      }).start();
    }, 300);
  });

  return (
    <Animated.Text
      style={{
        color: color,
        fontSize: 16,
        fontWeight: fonts.weight.semibold,
        marginLeft: 0,
      }}
    >
      {valueString}
    </Animated.Text>
  );
};

export default Switch;
