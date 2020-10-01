import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { pure } from 'recompact';
import styled from 'styled-components';
import { SIGN_TYPED_DATA } from '../../utils/signingMethods';
import { Text } from '../text';
import { colors, padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const deviceWidth = deviceUtils.dimensions.width;
const horizontalPadding = 24;

const MessageWrapper = styled(ScrollView)`
  border-color: ${colors.alpha(colors.blueGreyDark, 0.2)};
  border-radius: 20;
  border-width: 1;
  margin-bottom: 14;
  max-height: ${({ maxHeight }) => maxHeight};
  ${padding(14)}
  min-width: ${deviceWidth - horizontalPadding * 2};
`;

const TransactionMessage = ({ maxHeight = 100, message, method }) => {
  let msg = message;
  let maximumHeight = maxHeight;
  if (method === SIGN_TYPED_DATA) {
    try {
      msg = JSON.parse(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
    msg = JSON.stringify(msg, null, 4);
  }

  return (
    <MessageWrapper maxHeight={maximumHeight}>
      <Text color={colors.alpha(colors.blueGreyDark, 0.6)} size="lmedium">
        {msg}
      </Text>
    </MessageWrapper>
  );
};

export default pure(TransactionMessage);
