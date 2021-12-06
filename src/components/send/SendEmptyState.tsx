import React, { useRef } from 'react';
import { View } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/effects' was resolved to ... Remove this comment to see the full error message
import { sheetVerticalOffset } from '../../navigation/effects';
import { Icon } from '../icons';
import { Centered } from '../layout';

const duration = 200;
const transition = (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Transition.Sequence>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Out durationMs={duration} interpolation="easeIn" type="fade" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Together>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.In
        delayMs={duration}
        durationMs={duration}
        interpolation="easeOut"
        type="fade"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.In
        delayMs={duration}
        durationMs={duration / 2}
        interpolation="easeIn"
        type="scale"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  if (ref.current && ios) {
    // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    ref.current.animateNextTransition();
  }

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const icon = (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Icon
      color={colors.alpha(colors.blueGreyDark, 0.06)}
      height={88}
      name="send"
      style={{
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        marginBottom: ios ? 0 : 150,
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        marginTop: ios ? 0 : 150,
      }}
      width={91}
    />
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  if (android) {
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <View style={{ alignItems: 'center', flex: 1 }}>{icon}</View>;
  }

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered
      backgroundColor={colors.white}
      flex={1}
      justify="space-between"
      paddingBottom={sheetVerticalOffset + 19}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transitioning.View ref={ref} transition={transition}>
        {icon}
      </Transitioning.View>
    </Centered>
  );
};

export default SendEmptyState;
