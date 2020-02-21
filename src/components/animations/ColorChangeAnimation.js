import React, { useState, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { fonts, colors } from '../../styles';
import AnimateNumber from '@bankify/react-native-animate-number';

const Switch = ({ valueString, changeIndex }) => {
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

  const renderEstimatedTimeText = animatedNumber => {
    return (
      <Animated.Text
        style={{
          color: color,
          fontSize: 16,
          fontWeight: fonts.weight.semibold,
        }}
      >
        {String(animatedNumber).slice(changeIndex)}
      </Animated.Text>
    );
  };

  const formatAnimatedEstimatedTime = estimatedTime => {
    return parseFloat(estimatedTime || 0).toFixed(3);
  };

  return (
    <AnimateNumber
      formatter={formatAnimatedEstimatedTime}
      interval={20}
      renderContent={renderEstimatedTimeText}
      steps={6}
      timing="linear"
      value={valueString}
    />
  );
};

export default Switch;
