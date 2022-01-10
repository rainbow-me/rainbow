import { addHexPrefix } from '@walletconnect/utils';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { isSignTypedData, PERSONAL_SIGN } from '../../utils/signingMethods';
import { Row } from '../layout';
import { Text } from '../text';
import { isHexString } from '@rainbow-me/handlers/web3';
import { padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const deviceWidth = deviceUtils.dimensions.width;
const horizontalPadding = 24;

const Container = styled(Row)`
  max-height: ${({ maxHeight }) => maxHeight};
  min-height: ${({ minHeight }) => minHeight};
`;
const MessageWrapper = styled(ScrollView)`
  ${padding(12, 15)}
  border-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.08)};
  border-radius: 20;
  border-width: 1;
  margin-bottom: 14;
  min-width: ${deviceWidth - horizontalPadding * 2};
`;

const TransactionMessage = ({ maxHeight = 150, message, method }) => {
  const { colors } = useTheme();
  let msg = message;
  let maximumHeight = maxHeight;
  let minimumHeight = 150;
  if (isSignTypedData(method)) {
    maximumHeight = 200;
    minimumHeight = 200;
    try {
      msg = JSON.parse(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
    msg = JSON.stringify(msg, null, 4);
  } else if (method === PERSONAL_SIGN) {
    if (isHexString(addHexPrefix(msg))) {
      const normalizedMsg = addHexPrefix(msg);
      const stripped = normalizedMsg.substring(2);
      const buff = Buffer.from(stripped, 'hex');
      msg = buff.toString('utf8');
    }
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

export default TransactionMessage;
