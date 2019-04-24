import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import Divider from '../components/Divider';
import { Column } from '../components/layout';
import {
  Modal,
} from '../components/modal';
import {
  Bold,
  Text,
} from '../components/text';
import { Button } from '../components/buttons'
import { padding } from '../styles';
import { withWalletConnectConfirmationModal } from '../hoc';

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

const WalletConnectConfirmationModal = ({
  onCloseModal,
  onApprove,
  onReject,
  peerMeta,
}) => (
  <Modal height={300} onCloseModal={onCloseModal}>
    <Content>
      <DescriptionText>
        <Bold>{`${peerMeta.name}`}</Bold>
        {' wants to connect to your wallet.'}
      </DescriptionText>
    </Content>
    <Divider insetLeft={16} insetRight={16} />
    <Button onPress={onApprove}>
      {'Connect'}
    </Button>
    <Button onPress={onReject}>
      {'Cancel'}
    </Button>
  </Modal>
);

WalletConnectConfirmationModal.propTypes = {
  navigation: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  peerId: PropTypes.string.isRequired,
  peerMeta: PropTypes.object.isRequired,
};

export default compose(
  withWalletConnectConfirmationModal,
  withProps(({ navigation}) => {
    const { peerId, peerMeta } = navigation.state.params;
    return { peerId, peerMeta };
  }),
  withHandlers({
    onCloseModal: ({ navigation }) => () => navigation.goBack(),
    onApprove: ({ peerId, walletConnectApproveSession }) => () => walletConnectApproveSession(peerId),
    onReject: ({ peerId, walletConnectRejectSession }) => () => walletConnectRejectSession(peerId),
  }),
)(WalletConnectConfirmationModal);
