import { toString } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, TextInput } from 'react-native';

const styles = StyleSheet.create({
  textInput: {
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
});

const clearHandle = handle => handle && clearInterval(handle);

const AnimatedNumber = ({ formatter, steps, style, time, value, ...props }) => {
  const currentValue = useRef(0);
  const intervalHandle = useRef();
  const textInputRef = useRef();

  const stepSize = useMemo(
    () => (value - currentValue.current) / Number(steps),
    [steps, value]
  );

  const animateNumber = useCallback(() => {
    const nextVal = currentValue.current + stepSize;
    currentValue.current = nextVal;

    if (textInputRef.current) {
      textInputRef.current.setNativeProps({
        text: formatter(nextVal),
      });
    }

    if (nextVal >= value) {
      clearHandle(intervalHandle.current);
    }
  }, [formatter, stepSize, value]);

  useEffect(() => {
    if (currentValue.current !== value) {
      intervalHandle.current = setInterval(animateNumber, Number(time));
    }

    return () => clearHandle(intervalHandle.current);
  }, [animateNumber, time, value]);

  return (
    <TextInput
      {...props}
      editable={false}
      ref={textInputRef}
      style={[styles.textInput, style]}
      value={formatter(currentValue.current)}
    />
  );
};

AnimatedNumber.propTypes = {
  formatter: PropTypes.func,
  steps: PropTypes.number,
  time: PropTypes.number,
  value: PropTypes.number,
};

const defaultFormatter = value =>
  toString(Number.isInteger(value) ? Number(value) : Number(value).toFixed(2));

AnimatedNumber.defaultProps = {
  formatter: defaultFormatter,
  steps: 32,
  time: 10,
};

export default AnimatedNumber;
