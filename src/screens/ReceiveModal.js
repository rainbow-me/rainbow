import PropTypes from 'prop-types';
import React from 'react';
import { Share } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { compose, onlyUpdateForKeys } from 'recompact';
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
import { FloatingEmojis } from '../components/floating-emojis';
import { Br, Monospace, Text } from '../components/text';
import { withAccountAddress } from '../hoc';
import { useClipboard } from '../hooks';
import { colors } from '../styles';
import { haptics } from '../utils';

const QRCodeSize = 180;

const AddressText = styled(Monospace).attrs({
  color: colors.blueGreyLightest,
})`
  font-size: 13.86;
  line-height: 19;
  text-align: justify;
  width: 100%;
`;

const ReceiveScreen = ({ accountAddress }) => {
  const { setClipboard } = useClipboard();
  const { goBack } = useNavigation();

  return (
    <Modal height={472} onCloseModal={goBack}>
      <ModalHeader onPressClose={goBack} title="Receive" />
      <Divider inset={[0, 16]} />
      <Column align="center" flex={1} justify="start" padding={25}>
        <Text align="center" lineHeight="loose">
          Send Ether, ERC-20 tokens, or
          <Br />
          collectibles to your wallet:
        </Text>
        <QRCodeDisplay
          marginTop={22}
          size={QRCodeSize}
          value={accountAddress}
        />
        <Column marginTop={12} width={QRCodeSize}>
          <AddressText>
            {accountAddress.substring(0, accountAddress.length / 2)}
          </AddressText>
          <AddressText>
            {accountAddress.substring(accountAddress.length / 2)}
          </AddressText>
        </Column>
      </Column>
      <ModalFooterButtonsRow>
        <FloatingEmojis flex={1}>
          {({ onNewEmoji }) => (
            <ModalFooterButton
              icon="copy"
              label="Copy"
              onPress={() => {
                haptics.impactLight();
                onNewEmoji();
                setClipboard(accountAddress);
              }}
            />
          )}
        </FloatingEmojis>
        <ModalFooterButton
          icon="share"
          label="Share"
          onPress={() =>
            Share.share({
              message: accountAddress,
              title: 'My account address:',
            })
          }
        />
      </ModalFooterButtonsRow>
    </Modal>
  );
};

ReceiveScreen.propTypes = {
  accountAddress: PropTypes.string.isRequired,
};

export default compose(
  withAccountAddress,
  onlyUpdateForKeys(['accountAddress'])
)(ReceiveScreen);
