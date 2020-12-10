import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { pure } from 'recompact';
import styled from 'styled-components';
import { SIGN_TYPED_DATA } from '../../utils/signingMethods';
import { Row } from '../layout';
import { Text } from '../text';
import { colors, padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const deviceWidth = deviceUtils.dimensions.width;
const horizontalPadding = 24;

const Container = styled(Row)`
  max-height: ${({ maxHeight }) => maxHeight};
  min-height: ${({ minHeight }) => minHeight};
`;
const MessageWrapper = styled(ScrollView)`
  ${padding(12, 15)}
  border-color: ${colors.alpha(colors.blueGreyDark, 0.08)};
  border-radius: 20;
  border-width: 1;
  margin-bottom: 14;
  min-width: ${deviceWidth - horizontalPadding * 2};
`;

const TransactionMessage = ({ maxHeight = 150, message, method }) => {
  let msg = message;
  let maximumHeight = maxHeight;
  let minimumHeight = 150;
  if (method === SIGN_TYPED_DATA) {
    maximumHeight = 200;
    minimumHeight = 200;
    try {
      msg = JSON.parse(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
    msg = JSON.stringify(msg, null, 4);
  }

  return (
    <Container maxHeight={maximumHeight} minHeight={minimumHeight}>
      <MessageWrapper>
        <Text color={colors.alpha(colors.blueGreyDark, 0.6)} size="lmedium">
          {msg}
        </Text>
      </MessageWrapper>
    </Container>
  );
};

export default pure(TransactionMessage);
