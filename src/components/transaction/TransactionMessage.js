import { addHexPrefix } from '@walletconnect/legacy-utils';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { isSignTypedData } from '../../utils/signingMethods';
import { Row } from '../layout';
import { Text } from '../text';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { deviceUtils } from '@/utils';

const deviceWidth = deviceUtils.dimensions.width;
const horizontalPadding = 24;

const Container = styled(Row)({
  minHeight: ({ minHeight }) => minHeight,
  overflow: 'visible',
});

const MessageWrapper = styled(ScrollView)({
  marginBottom: 14,
});

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
  }

  return (
    <Container maxHeight={maximumHeight} minHeight={minimumHeight}>
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.6)}
        size="lmedium"
        style={{ ...padding.object(12, 15) }}
      >
        {msg}
      </Text>
    </Container>
  );
};

export default TransactionMessage;
