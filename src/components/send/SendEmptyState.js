import React, { useRef } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';
import { sheetVerticalOffset } from '../../navigation/effects';
import { Icon } from '../icons';
import { Centered } from '../layout';

const duration = 100;

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
      <Animated.View
        entering={FadeInDown.duration(duration).easing(Easing.out(Easing.ease))}
        exiting={FadeOut.duration(duration).easing(Easing.in(Easing.ease))}
      >
        {icon}
      </Animated.View>
    </Centered>
  );
};

export default SendEmptyState;
