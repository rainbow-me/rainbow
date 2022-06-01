import React from 'react';
import { Dimensions } from 'react-native';
import Animated, { Easing, FadeOut, Keyframe } from 'react-native-reanimated';
import { sheetVerticalOffset } from '../../navigation/effects';
import { Icon } from '../icons';
import { Centered } from '../layout';

const duration = 200;

const screenHeight = Dimensions.get('window').height;

const keyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: screenHeight }, { scale: 0.0001 }],
  },
  100: {
    easing: Easing.out(Easing.ease),
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
});

const SendEmptyState = () => {
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
    return (
      <Animated.View
        entering={keyframe.duration(duration)}
        exiting={FadeOut.duration(duration).easing(Easing.in(Easing.ease))}
        style={{ alignItems: 'center', flex: 1 }}
      >
        {icon}
      </Animated.View>
    );
  }

  return (
    <Centered
      backgroundColor={colors.white}
      flex={1}
      justify="space-between"
      paddingBottom={sheetVerticalOffset + 19}
    >
      <Animated.View
        entering={keyframe.duration(duration)}
        exiting={FadeOut.duration(duration).easing(Easing.in(Easing.ease))}
      >
        {icon}
      </Animated.View>
    </Centered>
  );
};

export default SendEmptyState;
