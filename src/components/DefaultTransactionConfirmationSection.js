import PropTypes from 'prop-types';
import React from 'react';
import { ScrollView } from 'react-native';
import lang from 'i18n-js';
import styled from 'styled-components';
import Divider from './Divider';
import { withSafeAreaViewInsetValues } from '../hoc';
import { borders, colors, padding } from '../styles';
import { Column } from './layout';
import { Smallcaps, Text, TruncatedAddress } from './text';

const Message = styled(Text).attrs({ size: 'lmedium' })`
  color: ${colors.alpha(colors.blueGreyDark, 0.6)}
  margin-top: 5;
`;

const AddressRow = styled(Column)`
  ${padding(19, 19, 18)}
  flex-shrink: 0;
`;

const Address = styled(TruncatedAddress).attrs({ size: 'lmedium' })`
  color: ${colors.alpha(colors.blueGreyDark, 0.6)}
  margin-top: 5;
`;

const MessageRow = styled(Column)`
  ${padding(15, 19, 15)}
  flex-shrink: 0;
`;

const BottomSheet = styled(Column).attrs({ justify: 'space-between' })`
  ${borders.buildRadius('top', 15)}
  background-color: ${colors.white};
  flex: 0;
  min-height: ${({ bottomInset }) => (bottomInset + 270)};
  padding-bottom: ${({ bottomInset }) => bottomInset};
  width: 100%;
`;

const SendButtonContainer = styled.View`
  ${padding(7, 15, 14)}
  flex-shrink: 0;
`;

const DefaultTransactionConfirmationSection = ({
  asset: {
    address,
    data,
    value,
  },
  safeAreaInset,
  sendButton,
}) => (
  <BottomSheet bottomInset={safeAreaInset.bottom}>
    <AddressRow>
      <Smallcaps>{lang.t('wallet.action.to')}</Smallcaps>
      <Address address={address} truncationLength={15}/>
    </AddressRow>
    <Divider />
    <MessageRow>
      <ScrollView>
        <Message>{data}</Message>
      </ScrollView>
    </MessageRow>
    <SendButtonContainer>
      {sendButton}
    </SendButtonContainer>
  </BottomSheet>
);

DefaultTransactionConfirmationSection.propTypes = {
  asset: PropTypes.shape({
    address: PropTypes.string,
    data: PropTypes.string,
    value: PropTypes.string,
  }),
  safeAreaInset: PropTypes.object,
  sendButton: PropTypes.object,
};

export default withSafeAreaViewInsetValues(DefaultTransactionConfirmationSection);
