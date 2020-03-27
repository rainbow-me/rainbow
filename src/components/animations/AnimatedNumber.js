import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { fonts } from '../../styles';

const clearHandle = handle => handle && clearTimeout(handle);

export const defaultAnimatedNumberProps = {
  formatter: value => Number(value).toString(),
  steps: 10,
  textAlign: 'right',
  time: 6,
};

const AnimatedNumber = ({
  disableTabularNums,
  formatter,
  steps,
  style,
  textAlign,
  time,
  value,
  ...props
}) => {
  const currentValue = useRef(value);
  const timeoutHandle = useRef();
  const textInputRef = useRef();

  const isPositive = useMemo(() => value - currentValue.current > 0, [value]);
  const stepSize = useMemo(
    () => (value - currentValue.current) / Number(steps),
    [steps, value]
  );

  const animateNumber = useCallback(() => {
    const nextValue = currentValue.current + stepSize;
    const isComplete =
      (isPositive && nextValue >= value) || (!isPositive && nextValue <= value);

    currentValue.current = isComplete ? value : nextValue;

    if (textInputRef.current) {
      textInputRef.current.setNativeProps({
        text: formatter(currentValue.current),
      });
    }

    if (isComplete) {
      clearHandle(timeoutHandle.current);
    }
  }, [formatter, isPositive, stepSize, value]);

  const animateNumberInterval = useCallback(() => {
    clearHandle(timeoutHandle.current);
    InteractionManager.runAfterInteractions(() => {
      animateNumber();
      timeoutHandle.current = setTimeout(animateNumberInterval, Number(time));
    });
  }, [animateNumber, time]);

  useEffect(() => {
    if (currentValue.current !== value) {
      animateNumberInterval();
    }
    return () => clearHandle(timeoutHandle.current);
  }, [animateNumber, animateNumberInterval, time, value]);

  return (
    <TextInput
      {...props}
      editable={false}
      ref={textInputRef}
      style={[
        {
          fontFamily: fonts.family.SFProRounded,
          fontVariant: disableTabularNums ? undefined : ['tabular-nums'],
          textAlign,
        },
        style,
      ]}
      value={formatter(currentValue.current)}
    />
  );
};

AnimatedNumber.propTypes = {
  disableTabularNums: PropTypes.bool,
  formatter: PropTypes.func,
  steps: PropTypes.number,
  textAlign: PropTypes.string,
  time: PropTypes.number,
  value: PropTypes.number,
};

AnimatedNumber.defaultProps = defaultAnimatedNumberProps;

export default React.memo(AnimatedNumber);
