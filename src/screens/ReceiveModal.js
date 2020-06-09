import { toLower } from 'lodash';
import React from 'react';
import { Platform, Share } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSelector } from 'react-redux';
import styled from 'styled-components/primitives';
import Divider from '../components/Divider';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { FloatingEmojis } from '../components/floating-emojis';
import { Column } from '../components/layout';
import {
  Modal,
  ModalFooterButton,
  ModalFooterButtonsRow,
  ModalHeader,
} from '../components/modal';
import { Br, Monospace, Text } from '../components/text';
import { useClipboard } from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { colors } from '../styles';
import { haptics } from '../utils';

const statusBarHeight = getStatusBarHeight(true);
const QRCodeSize = Platform.OS === 'ios' ? 180 : 190;

const AddressText = styled(Monospace).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.6),
})`
  font-size: 13.86;
  letter-spacing: null;
  line-height: 19;
  text-align: justify;
  width: 100%;
`;

const ReceiveModal = () => {
  const { setClipboard } = useClipboard();
  const { goBack } = useNavigation();
  const accountAddress = useSelector(({ settings: { accountAddress } }) =>
    toLower(accountAddress)
  );

  return (
    <Modal height={472} marginBottom={statusBarHeight} onCloseModal={goBack}>
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
        <FloatingEmojis
          distance={250}
          duration={500}
          fadeOut={false}
          flex={1}
          scaleTo={0}
          size={50}
          wiggleFactor={0}
        >
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

export default React.memo(ReceiveModal);
