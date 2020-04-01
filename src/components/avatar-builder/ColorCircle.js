import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';

const ColorCircle = ({ backgroundColor, isSelected, onPressColor }) => (
  <View align="center" height={42} justify="center" width={39}>
    <ButtonPressAnimation
      alignSelf="center"
      duration={100}
      easing={Easing.bezier(0.19, 1, 0.22, 1)}
      enableHapticFeedback
      justifyContent="center"
      onPress={onPressColor}
      scaleTo={0.7}
      width={39}
    >
      <View
        backgroundColor={backgroundColor}
        borderRadius={15}
        height={24}
        alignSelf="center"
        isSelected={isSelected}
        shadowColor={colors.black}
        shadowOffset={{ height: 4, width: 0 }}
        shadowOpacity={0.2}
        shadowRadius={5}
        width={24}
      />
    </ButtonPressAnimation>
  </View>
);

ColorCircle.propTypes = {
  backgroundColor: PropTypes.string,
  isSelected: PropTypes.bool,
  onPressColor: PropTypes.func,
};

ColorCircle.defaultProps = {
  backgroundColor: 'blue',
  isSelected: false,
};

export default ColorCircle;
