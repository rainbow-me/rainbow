import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';
import { sheetVerticalOffset } from '../../navigation/effects';
import { Icon } from '../icons';
import { Centered } from '../layout';

const duration = 200;

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
        entering={FadeInDown.duration(duration).easing(Easing.out(Easing.ease))}
        exiting={FadeOut.duration(duration).easing(Easing.in(Easing.ease))}
        style={sx.androidContainer}
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
        entering={FadeInDown.duration(duration).easing(Easing.out(Easing.ease))}
        exiting={FadeOut.duration(duration).easing(Easing.in(Easing.ease))}
      >
        {icon}
      </Animated.View>
    </Centered>
  );
};

export default SendEmptyState;

const sx = StyleSheet.create({
  androidContainer: { alignItems: 'center', flex: 1 },
});
