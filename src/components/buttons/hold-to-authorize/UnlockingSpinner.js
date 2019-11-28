import AnimateNumber from '@bankify/react-native-animate-number';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { colors } from '../../../styles';
import { ColumnWithMargins, RowWithMargins } from '../../layout';
import Spinner from '../../Spinner';
import { Text } from '../../text';

const renderCountdownText = animatedTimeRemaining => (
  <Text
    color={colors.alpha(colors.white, 0.4)}
    lineHeight="tight"
    size="smedium"
    weight="medium"
  >
    {`~ ${animatedTimeRemaining}s Remaining`}
  </Text>
);

const UnlockingSpinner = ({ interval, timeRemaining }) => {
  const formatter = useCallback(
    animatedNumber =>
      Math.max(Math.ceil((timeRemaining - animatedNumber) / interval), 0),
    [interval, timeRemaining]
  );

  return (
    <ColumnWithMargins align="center" justify="center" margin={2}>
      <RowWithMargins align="center" margin={8}>
        <Spinner duration={1200} />
        <Text color="white" lineHeight="loose" size="large" weight="semibold">
          Unlocking
        </Text>
      </RowWithMargins>
      {timeRemaining && (
        <AnimateNumber
          formatter={formatter}
          interval={interval}
          renderContent={renderCountdownText}
          steps={timeRemaining / interval}
          timing="linear"
          value={timeRemaining}
        />
      )}
    </ColumnWithMargins>
  );
};

UnlockingSpinner.propTypes = {
  interval: PropTypes.number,
  timeRemaining: PropTypes.number,
};

UnlockingSpinner.defaultProps = {
  interval: 1000,
};

export default React.memo(UnlockingSpinner);
