import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-primitives';
import { colors, fonts } from '../../styles';

const ValueTime = ({
  children,
  selected,
}) => (
  <Text style={{
    color: selected ? '#fff' : colors.grey,
    fontWeight: fonts.weight.semibold,
    height: 30,
    lineHeight: 30,
    overflow: 'hidden',
    textAlign: 'center',
    width: 30,
  }}>
    {children}
  </Text>
);

ValueTime.propTypes = {
  children: PropTypes.string,
  selected: PropTypes.bool,
};

export default ValueTime;
