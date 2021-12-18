import { addHexPrefix } from '@walletconnect/utils';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { PERSONAL_SIGN, SIGN_TYPED_DATA } from '../../utils/signingMethods';
import { Row } from '../layout';
import { Text } from '../text';
import { isHexString } from '@rainbow-me/handlers/web3';
import styled from '@rainbow-me/styled';
import { padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const deviceWidth = deviceUtils.dimensions.width;
const horizontalPadding = 24;

const Container = styled(Row)({
  maxHeight: ({ maxHeight }) => maxHeight,
  minHeight: ({ minHeight }) => minHeight,
});

const MessageWrapper = styled(ScrollView)({
  ...padding.object(12, 15),
  borderColor: ({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.08),
  borderRadius: 20,
  borderWidth: 1,
  marginBottom: 14,
  minWidth: deviceWidth - horizontalPadding * 2,
});

const TransactionMessage = ({ maxHeight = 150, message, method }) => {
  const { colors } = useTheme();
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
