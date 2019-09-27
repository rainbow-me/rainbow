import React, { useEffect, useRef } from 'react';
import { Transitioning, Transition } from 'react-native-reanimated';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { sheetVerticalOffset } from '../../navigation/transitions/effects';
import { colors } from '../../styles';

const duration = 200;
const transition = (
  <Transition.Sequence>
    <Transition.Out durationMs={duration} interpolation="easeIn" type="fade" />
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    <Transition.Together>
      <Transition.In
        delayMs={duration}
        durationMs={duration}
        interpolation="easeOut"
        type="fade"
      />
      <Transition.In
        delayMs={duration}
        durationMs={duration / 2}
        interpolation="easeIn"
        type="scale"
      />
      <Transition.In
        delayMs={duration}
        durationMs={duration}
        interpolation="easeInOut"
        type="slide-bottom"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const SendEmptyState = () => {
  const ref = useRef();
  useEffect(() =>
    ref && ref.current ? ref.current.animateNextTransition() : undefined
  );

  return (
    <Centered
      backgroundColor={colors.white}
      flex={1}
      justify="space-between"
      paddingBottom={sheetVerticalOffset + 19}
    >
      <Transitioning.View ref={ref} transition={transition}>
        <Icon
          color={colors.alpha(colors.blueGreyDark, 0.06)}
          name="send"
          style={{
            height: 88,
            width: 91,
          }}
        />
      </Transitioning.View>
    </Centered>
  );
};

export default SendEmptyState;
