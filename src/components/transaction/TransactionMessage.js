import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { pure } from 'recompose';
import { colors } from '../../styles';
import { SIGN_TYPED_DATA } from '../../utils/signingMethods';
import { Text } from '../text';

const TransactionMessage = ({ maxHeight, message, method }) => {
  let msg = message;
  let maximumHeight = maxHeight;
  if (method === SIGN_TYPED_DATA) {
    maximumHeight += 100;
    try {
      msg = JSON.parse(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
    msg = JSON.stringify(msg, null, 4);
  }

  return (
    <ScrollView
      style={{
        maxHeight: maximumHeight,
      }}
    >
      <Text color={colors.alpha(colors.blueGreyDark, 0.6)} size="lmedium">
        {msg}
      </Text>
    </ScrollView>
  );
};
TransactionMessage.propTypes = {
  maxHeight: PropTypes.number,
  message: PropTypes.string,
};

TransactionMessage.defaultProps = {
  maxHeight: 100,
};

export default pure(TransactionMessage);
