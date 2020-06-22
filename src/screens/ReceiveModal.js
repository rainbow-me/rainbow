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
const QRCodeSize = Platform.OS === 'ios' ? 250 : 190;

const AddressText = styled(Monospace).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.6),
})`
  font-size: 13.86;
  letter-spacing: null;
  line-height: 19;
  text-align: justify;
  width: 100%;
`;

const TopHandle = styled.View`
  width: 35px;
  height: 5px;
  border-radius: 3px;
  background-color: ${colors.white};
`;

const ReceiveModal = () => {
  const { setClipboard } = useClipboard();
  const { goBack } = useNavigation();
  const accountAddress = useSelector(({ settings: { accountAddress } }) =>
    toLower(accountAddress)
  );

  return (
    // <Modal height={360} radius={39} marginBottom={statusBarHeight} onCloseModal={goBack} margin={20}>
    <Column align="center">
      <TopHandle />
      <Column
        align="center"
        marginTop={19}
        margin={24}
        padding={24}
        borderRadius={40}
        backgroundColor={colors.white}
      >
        <QRCodeDisplay size={QRCodeSize} value={accountAddress} />
      </Column>
    </Column>
    //   <ModalFooterButtonsRow>
    //     <FloatingEmojis
    //       distance={250}
    //       duration={500}
    //       fadeOut={false}
    //       flex={1}
    //       scaleTo={0}
    //       size={50}
    //       wiggleFactor={0}
    //     >
    //       {({ onNewEmoji }) => (
    //         <ModalFooterButton
    //           icon="copy"
    //           label="Copy"
    //           onPress={() => {
    //             haptics.impactLight();
    //             onNewEmoji();
    //             setClipboard(accountAddress);
    //           }}
    //         />
    //       )}
    //     </FloatingEmojis>
    //     <ModalFooterButton
    //       icon="share"
    //       label="Share"
    //       onPress={() =>
    //         Share.share({
    //           message: accountAddress,
    //           title: 'My account address:',
    //         })
    //       }
    //     />
    //   </ModalFooterButtonsRow>
    // </Modal>
  );
};

export default React.memo(ReceiveModal);
