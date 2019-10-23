import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../../styles';
import { ColumnWithMargins, RowWithMargins } from '../../layout';
import Spinner from '../../Spinner';
import { Text } from '../../text';

const UnlockingSpinner = ({ timeRemaining }) => (
  <ColumnWithMargins align="center" justify="center" margin={2}>
    <RowWithMargins margin={8}>
      <Spinner duration={1200} />
      <Text color="white" lineHeight="loose" size="large" weight="semibold">
        Unlocking
      </Text>
    </RowWithMargins>
    {timeRemaining && (
      <Text
        color={colors.alpha(colors.white, 0.4)}
        lineHeight="tight"
        size="smedium"
        weight="medium"
      >
        {`~ ${timeRemaining} Remaining`}
      </Text>
    )}
  </ColumnWithMargins>
);

UnlockingSpinner.propTypes = {
  timeRemaining: PropTypes.string,
};

export default React.memo(UnlockingSpinner);
