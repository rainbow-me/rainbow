import AnimateNumber from '@bankify/react-native-animate-number';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { colors } from '../../../styles';
import { ColumnWithMargins, RowWithMargins } from '../../layout';
import Spinner from '../../Spinner';
import { Text } from '../../text';

const showTimeRemainingDelay = 1000;

const timeRemainingTransition = (
  <Transition.Sequence>
    <Transition.Together>
      <Transition.Out durationMs={200} interpolation="easeOut" type="fade" />
      <Transition.Out
        delayMs={100}
        durationMs={200}
        interpolation="easeOut"
        type="slide-bottom"
      />
    </Transition.Together>
    <Transition.Change durationMs={100} interpolation="easeOut" />
    <Transition.Together>
      <Transition.In durationMs={200} interpolation="easeOut" type="fade" />
      <Transition.In
        delayMs={100}
        durationMs={200}
        interpolation="easeOut"
        type="slide-bottom"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const unlockingTransition = (
  <Transition.Sequence>
    <Transition.Out durationMs={200} interpolation="easeInOut" type="fade" />
    <Transition.Change durationMs={200} interpolation="easeInOut" />
    <Transition.Together>
      <Transition.In durationMs={100} interpolation="easeOut" type="fade" />
      <Transition.In durationMs={100} interpolation="easeOut" type="scale" />
    </Transition.Together>
  </Transition.Sequence>
);

const renderCountdownText = animatedTimeRemaining => (
  <Text
    color={colors.alpha(colors.white, 0.4)}
    lineHeight="tight"
    size="smedium"
    style={{
      fontVariant: ['tabular-nums'],
    }}
    weight="medium"
  >
    {`~ ${animatedTimeRemaining}s Remaining`}
  </Text>
);

const UnlockingSpinner = ({
  creationTimestamp,
  estimatedApprovalTimeInMs,
  interval,
}) => {
  const timeRemaining = useMemo(
    () =>
      Math.max(creationTimestamp + estimatedApprovalTimeInMs - Date.now(), 0),
    [creationTimestamp, estimatedApprovalTimeInMs]
  );
  const timingRemainingRef = useRef();
  const unlockingRef = useRef();
  const [showTimeRemaining, setShowTimeRemaining] = useState(false);

  const animateNextTransition = useCallback(() => {
    if (timingRemainingRef.current) {
      timingRemainingRef.current.animateNextTransition();
    }
    if (unlockingRef.current) {
      unlockingRef.current.animateNextTransition();
    }
  }, [timingRemainingRef, unlockingRef]);

  const formatter = useCallback(
    animatedNumber =>
      Math.max(Math.ceil((timeRemaining - animatedNumber) / interval), 0),
    [interval, timeRemaining]
  );

  useEffect(() => {
    const removeTimeRemaining = setTimeout(() => {
      animateNextTransition();
      setShowTimeRemaining(false);
    }, timeRemaining + showTimeRemainingDelay);

    const showTimeRemaining = setTimeout(() => {
      animateNextTransition();
      setShowTimeRemaining(true);
    }, showTimeRemainingDelay);

    return () => {
      clearTimeout(removeTimeRemaining);
      clearTimeout(showTimeRemaining);
    };
  }, [animateNextTransition, timeRemaining]);

  return (
    <ColumnWithMargins align="center" height="100%" justify="center" margin={2}>
      <Transitioning.View ref={unlockingRef} transition={unlockingTransition}>
        <RowWithMargins align="center" margin={8}>
          <Spinner duration={1200} />
          <Text color="white" lineHeight="loose" size="large" weight="semibold">
            Unlocking
          </Text>
        </RowWithMargins>
      </Transitioning.View>
      <Transitioning.View
        ref={timingRemainingRef}
        transition={timeRemainingTransition}
      >
        {showTimeRemaining && timeRemaining && (
          <AnimateNumber
            formatter={formatter}
            interval={interval}
            renderContent={renderCountdownText}
            steps={timeRemaining / interval}
            timing="linear"
            value={timeRemaining}
          />
        )}
      </Transitioning.View>
    </ColumnWithMargins>
  );
};

UnlockingSpinner.propTypes = {
  creationTimestamp: PropTypes.number,
  estimatedApprovalTimeInMs: PropTypes.number,
  interval: PropTypes.number,
};

UnlockingSpinner.defaultProps = {
  interval: 1000,
};

export default React.memo(UnlockingSpinner);
