import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { Button } from '../components/buttons';
import Divider from '../components/Divider';
import { Nbsp } from '../components/html-entities';
import { Column } from '../components/layout';
import { Modal } from '../components/modal';
import { Bold, Text } from '../components/text';
import { withWalletConnectConfirmationModal } from '../hoc';
import { padding } from '../styles';

const DescriptionText = styled(Text)`
  line-height: 21;
  margin-bottom: 22;
  text-align: center;
`;

const WalletConnectConfirmationModal = ({
  onApprove,
  onCloseModal,
  onReject,
  peerMeta,
}) => (
  <Modal height={300} onCloseModal={onCloseModal}>
    <Column
      align="center"
      css={padding(25)}
      flex={1}
      justify="start"
    >
      <DescriptionText>
        <Bold>{get(peerMeta, 'name', 'Unknown dapp')}</Bold>
        <DescriptionText><Nbsp />wants to connect to your wallet.</DescriptionText>
      </DescriptionText>
    </Column>
    <Divider insetLeft={16} insetRight={16} />
    <Button onPress={onApprove}>Connect</Button>
    <Button onPress={onReject}>Cancel</Button>
  </Modal>
);

WalletConnectConfirmationModal.propTypes = {
  navigation: PropTypes.object.isRequired,
  onApprove: PropTypes.func.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  peerId: PropTypes.string.isRequired,
  peerMeta: PropTypes.object.isRequired,
};

export default compose(
  withWalletConnectConfirmationModal,
  withProps(({ navigation }) => ({
    peerId: navigation.getParam('peerId'),
    peerMeta: navigation.getParam('peerMeta'),
  })),
  withHandlers({ onCloseModal: ({ navigation }) => () => navigation.goBack() }),
  withHandlers({
    onApprove: ({ onCloseModal, peerId, walletConnectApproveSession }) => () => {
      walletConnectApproveSession(peerId);
      return onCloseModal();
    },
    onReject: ({ onCloseModal, peerId, walletConnectRejectSession }) => () => {
      walletConnectRejectSession(peerId);
      onCloseModal();
    },
  }),
)(WalletConnectConfirmationModal);
