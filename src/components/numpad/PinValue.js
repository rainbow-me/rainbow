import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Column, Flex } from '../../components/layout';
import styled from '@/styled-thing';

const FilledValue = styled(Column)({
  borderRadius: 20,
  height: 20,
  marginLeft: 10,
  marginRight: 10,
  width: 20,
});

const EmptyValue = styled(Column)({
  borderColor: ({ theme: { colors } }) => colors.appleBlue,
  borderRadius: 20,
  borderWidth: 3,
  height: 20,
  marginLeft: 10,
  marginRight: 10,
  width: 20,
});

const PinValue = ({ translateX, value, ...props }) => {
  const { colors } = useTheme();

  const animatedStyles = useAnimatedStyle(() => ({
    flexDirection: 'row',
    transform: [{ translateX: translateX?.value ?? 0 }],
  }));

  return (
    <Flex {...props}>
      <Animated.View style={animatedStyles}>
        {value && value.length ? <FilledValue backgroundColor={colors.appleBlue} /> : <EmptyValue />}
        {value && value.length > 1 ? <FilledValue backgroundColor={colors.appleBlue} /> : <EmptyValue />}
        {value && value.length > 2 ? <FilledValue backgroundColor={colors.appleBlue} /> : <EmptyValue />}
        {value && value.length > 3 ? <FilledValue backgroundColor={colors.appleBlue} /> : <EmptyValue />}
      </Animated.View>
    </Flex>
  );
};

export default React.memo(PinValue);
