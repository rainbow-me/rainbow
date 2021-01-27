import React, { useRef } from 'react';
import { View } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { sheetVerticalOffset } from '../../navigation/effects';
import { Icon } from '../icons';
import { Centered } from '../layout';

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

  if (ref.current && ios) {
    ref.current.animateNextTransition();
  }

  const { colors } = useTheme();

  const icon = (
    <Icon
      color={colors.alpha(colors.blueGreyDark, 0.06)}
      height={88}
      name="send"
      style={{
        marginBottom: ios ? 0 : 150,
        marginTop: ios ? 0 : 150,
      }}
      width={91}
    />
  );

  if (android) {
    return <View style={{ alignItems: 'center', flex: 1 }}>{icon}</View>;
  }

  return (
    <Centered
      backgroundColor={colors.white}
      flex={1}
      justify="space-between"
      paddingBottom={sheetVerticalOffset + 19}
    >
      <Transitioning.View ref={ref} transition={transition}>
        {icon}
      </Transitioning.View>
    </Centered>
  );
};

export default SendEmptyState;
