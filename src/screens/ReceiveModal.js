import PropTypes from 'prop-types';
import React from 'react';
import { Clipboard, Share } from 'react-native';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import Divider from '../components/Divider';
import { Column } from '../components/layout';
import {
  Modal,
  ModalFooterButton,
  ModalFooterButtonsRow,
  ModalHeader,
} from '../components/modal';
import QRCodeDisplay from '../components/QRCodeDisplay';
import {
  Br,
  Monospace,
  Text,
} from '../components/text';
import { withAccountAddress } from '../hoc';
import { colors, padding } from '../styles';

const QRCodeSize = 180;

const AddressText = styled(Monospace).attrs({
  color: colors.blueGreyLighter,
})`
  font-size: 13.86;
  line-height: 19;
  text-align: justify;
  width: 100%;
`;

const AddressTextContainer = styled(Column)`
  margin-top: 12;
  width: ${QRCodeSize};
`;

const Content = styled(Column).attrs({
  align: 'center',
  flex: 1,
  justify: 'start',
})`
  ${padding(25)}
`;

const DescriptionText = styled(Text)`
  line-height: 21;
  margin-bottom: 22;
  text-align: center;
`;

const ReceiveScreen = ({
  accountAddress,
  onCloseModal,
  onPressCopyAddress,
  onPressShareAddress,
}) => (
  <Modal height={472} onCloseModal={onCloseModal}>
    <ModalHeader
      onPressClose={onCloseModal}
      title="Receive"
    />
    <Divider inset={[0, 16]} />
    <Content>
      <DescriptionText>
        Send Ether, ERC-20 tokens, or<Br />
        collectibles to your wallet:
      </DescriptionText>
      <QRCodeDisplay
        size={QRCodeSize}
        value={accountAddress}
      />
      <AddressTextContainer>
        <AddressText>
          {accountAddress.substring(0, accountAddress.length / 2)}
        </AddressText>
        <AddressText>
          {accountAddress.substring(accountAddress.length / 2)}
        </AddressText>
      </AddressTextContainer>
    </Content>
    <ModalFooterButtonsRow>
      <ModalFooterButton
        icon="copy"
        label="Copy"
        onPress={onPressCopyAddress}
      />
      <ModalFooterButton
        icon="share"
        label="Share"
        onPress={onPressShareAddress}
      />
    </ModalFooterButtonsRow>
  </Modal>
);

ReceiveScreen.propTypes = {
  accountAddress: PropTypes.string.isRequired,
  navigation: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  onPressCopyAddress: PropTypes.func,
  onPressShareAddress: PropTypes.func,
};

export default compose(
  withAccountAddress,
  withHandlers({
    onCloseModal: ({ navigation }) => () => navigation.goBack(),
    onPressCopyAddress: ({ accountAddress }) => () => Clipboard.setString(accountAddress),
    onPressShareAddress: ({ accountAddress }) => () => (
      Share.share({
        message: accountAddress,
        title: 'My account address:',
      })
    ),
  }),
  onlyUpdateForKeys(['accountAddress']),
)(ReceiveScreen);
