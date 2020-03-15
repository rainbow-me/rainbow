import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { pure } from 'recompose';
import { colors } from '../../styles';
import { Text } from '../text';

const TransactionMessage = ({ maxHeight, message }) => (
  <ScrollView style={{ maxHeight }}>
    <Text color={colors.alpha(colors.blueGreyDark, 0.6)} size="lmedium">
      {message}
    </Text>
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
