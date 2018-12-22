import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView } from 'react-native';
import lang from 'i18n-js';
import styled from 'styled-components';
import { withSafeAreaViewInsetValues } from '../hoc';
import { borders, colors, padding } from '../styles';
import { Column } from './layout';
import { Smallcaps, Text } from './text';

const Message = styled(Text).attrs({ size: 'lmedium' })`
  color: ${colors.alpha(colors.blueGreyDark, 0.6)}
  margin-top: 5;
`;

const MessageRow = styled(Column)`
  ${padding(19, 19, 18)}
  flex-shrink: 0;
`;

const BottomSheet = styled(Column).attrs({ justify: 'space-between' })`
  ${borders.buildRadius('top', 15)}
  background-color: ${colors.white};
  flex: 0;
  min-height: ${({ bottomInset }) => (bottomInset + 236)};
  padding-bottom: ${({ bottomInset }) => bottomInset};
  width: 100%;
`;

const SendButtonContainer = styled.View`
  ${padding(7, 15, 14)}
  flex-shrink: 0;
`;

const MessageSigningSection = ({
  message,
  safeAreaInset,
  sendButton,
}) => (
  <BottomSheet bottomInset={safeAreaInset.bottom}>
    <MessageRow>
      <Smallcaps>{lang.t('wallet.message_signing.message')}</Smallcaps>
      <ScrollView>
        <Message>{message}</Message>
      </ScrollView>
    </MessageRow>
    <SendButtonContainer>
      {sendButton}
    </SendButtonContainer>
  </BottomSheet>
);

MessageSigningSection.propTypes = {
  message: PropTypes.string,
  safeAreaInset: PropTypes.object,
  sendButton: PropTypes.object,
};

export default withSafeAreaViewInsetValues(MessageSigningSection);
