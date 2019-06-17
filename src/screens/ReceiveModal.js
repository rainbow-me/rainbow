import PropTypes from 'prop-types';
import React from 'react';
import { Clipboard, Share } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withState,
} from 'recompact';
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
import {
  Br,
  Monospace,
  Text,
} from '../components/text';
import { withAccountAddress } from '../hoc';
import { colors, padding } from '../styles';

const QRCodeSize = 180;

const AddressText = styled(Monospace).attrs({
  color: colors.blueGreyLightest,
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
  emojiCount,
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
      <Column flex={1}>
        <ModalFooterButton
          icon="copy"
          label="Copy"
          onPress={onPressCopyAddress}
        />
        <FloatingEmojis
          count={emojiCount}
          distance={130}
          emoji="+1"
          size="h2"
        />
      </Column>
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
  emojiCount: PropTypes.number,
  navigation: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  onPressCopyAddress: PropTypes.func,
  onPressShareAddress: PropTypes.func,
};

export default compose(
  withAccountAddress,
  withState('emojiCount', 'setEmojiCount', 0),
  withHandlers({
    onCloseModal: ({ navigation }) => () => navigation.goBack(),
    onPressCopyAddress: ({ accountAddress, emojiCount, setEmojiCount }) => () => {
      ReactNativeHapticFeedback.trigger('impactLight');
      setEmojiCount(emojiCount + 1);
      Clipboard.setString(accountAddress);
    },
    onPressShareAddress: ({ accountAddress }) => () => (
      Share.share({
        message: accountAddress,
        title: 'My account address:',
      })
    ),
  }),
  onlyUpdateForKeys(['accountAddress', 'emojiCount']),
)(ReceiveScreen);
