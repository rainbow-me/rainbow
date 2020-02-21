import React, { useState, useEffect } from 'react';
import { Animated, Easing, Text } from 'react-native';
import { fonts } from '../../styles';
import AnimateNumber from '@bankify/react-native-animate-number';

const Switch = ({
  amountOfDigits,
  changeIndex,
  valueString,
  basicColor,
  changeColor,
  animationDurations,
  animateNumberInterval,
}) => {
  const [value] = useState(new Animated.Value(0));
  const [lastValueString, setLastValueString] = useState(undefined);

  const color = value.interpolate({
    inputRange: [0, 1],
    outputRange: [basicColor, changeColor],
  });

  useEffect(() => {
    if (lastValueString) {
      Animated.timing(value, {
        duration: animationDurations.start,
        easing: Easing.linear,
        toValue: 1,
      }).start();

      setTimeout(() => {
        Animated.timing(value, {
          duration: animationDurations.end,
          easing: Easing.linear,
          toValue: 0,
        }).start();
      }, animationDurations.start + animationDurations.timeout);
    }
    setLastValueString(valueString);
  }, [valueString]);

  const renderEstimatedTimeText = animatedNumber => {
    return (
      <>
        <Text
          style={{
            color: basicColor,
            fontSize: 16,
            fontWeight: fonts.weight.semibold,
            marginLeft: 0,
          }}
        >
          {String(animatedNumber).slice(0, changeIndex)}
        </Text>
        <Animated.Text
          style={{
            color: color,
            fontSize: 16,
            fontWeight: fonts.weight.semibold,
            marginLeft: 0,
          }}
        >
          {String(animatedNumber).slice(changeIndex)}
        </Animated.Text>
      </>
    );
  };

  const formatAnimatedEstimatedTime = estimatedTime =>
    parseFloat(estimatedTime || 0).toFixed(amountOfDigits);

  return (
    <AnimateNumber
      formatter={formatAnimatedEstimatedTime}
      interval={animateNumberInterval}
      renderContent={renderEstimatedTimeText}
      steps={6}
      timing="linear"
      value={valueString}
      initial={valueString}
    />
  );
};

export default Switch;
