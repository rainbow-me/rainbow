import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { fonts } from '../../styles';

const clearHandle = handle => handle && clearInterval(handle);

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
  const intervalHandle = useRef();
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
      clearHandle(intervalHandle.current);
    }
  }, [formatter, isPositive, stepSize, value]);

  useEffect(() => {
    if (currentValue.current !== value) {
      clearHandle(intervalHandle.current);
      InteractionManager.runAfterInteractions(() => {
        intervalHandle.current = setInterval(animateNumber, Number(time));
      });
    }
    return () => clearHandle(intervalHandle.current);
  }, [animateNumber, time, value]);

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
