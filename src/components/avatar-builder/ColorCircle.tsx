import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { EasingNode } from 'react-native-reanimated';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';

const ColorCircle = ({ backgroundColor, isSelected, onPressColor }: any) => {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View align="center" height={42} justify="center" width={40}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        alignSelf="center"
        duration={100}
        easing={EasingNode.bezier(0.19, 1, 0.22, 1)}
        enableHapticFeedback
        justifyContent="center"
        onPress={onPressColor}
        scaleTo={0.7}
        width={40}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <View
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          alignSelf="center"
          backgroundColor={backgroundColor}
          borderRadius={15}
          height={24}
          isSelected={isSelected}
          shadowColor={colors.shadowBlack}
          shadowOffset={{ height: 4, width: 0 }}
          shadowOpacity={0.2}
          shadowRadius={5}
          width={24}
        />
      </ButtonPressAnimation>
    </View>
  );
};

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
