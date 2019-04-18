import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { pure } from 'recompose';
import { colors } from '../../styles';
import { Monospace } from '../text';

const TransactionMessage = ({ maxHeight, message }) => (
  <ScrollView style={{ maxHeight }}>
    <Monospace color={colors.blueGreyDarkTransparent} size="lmedium">
      {message}
    </Monospace>
  </ScrollView>
);

TransactionMessage.propTypes = {
  maxHeight: PropTypes.number,
  message: PropTypes.string,
};

TransactionMessage.defaultProps = {
  maxHeight: 100,
};

export default pure(TransactionMessage);
