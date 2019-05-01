import PropTypes from 'prop-types';
import React from 'react';
import { Clipboard, Share, Animated } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withState,
} from 'recompact';
import styled from 'styled-components/primitives';
import { Column } from '../components/layout';
import {
  ModalFooterButton,
  ModalFooterButtonsRow,
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
import FloatingPanel from '../components/expanded-state/FloatingPanel';
import { deviceUtils } from '../utils';

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
  justify: 'center',
})`
  ${padding(25)}
`;

const DescriptionText = styled(Text)`
  line-height: 21;
  margin-bottom: 22;
  text-align: center;
  color: ${colors.white};
`;

const ReceiveScreen = ({
  accountAddress,
  drawerOpenProgress,
  emojiCount,
  onCloseModal,
  onPressCopyAddress,
  onPressShareAddress,
}) => (
  <Column height='100%' >
    <Content>
      <DescriptionText>
        Send Ether, ERC-20 tokens, or<Br />
        collectibles to your wallet:
      </DescriptionText>
      <FloatingPanel style={{ padding: 10, paddingBottom: 10, width: null }}>
        <QRCodeDisplay
          size={QRCodeSize}
          value={accountAddress}
        />
      </FloatingPanel>
      <AddressTextContainer>
        <AddressText>
          {accountAddress.substring(0, accountAddress.length / 2)}
        </AddressText>
        <AddressText>
          {accountAddress.substring(accountAddress.length / 2)}
        </AddressText>
      </AddressTextContainer>
    </Content>
    <Animated.View style={{
      transform: [{
        translateY: drawerOpenProgress.interpolate({
          inputRange: [0, 0.9, 1],
          outputRange: [100, 100, 0],
        }),
      }, {
        translateX: drawerOpenProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [deviceUtils.dimensions.width, 0],
        }),
      }],
    }}
    >
      <ModalFooterButtonsRow>
        <ModalFooterButton
          icon="share"
          label="Share"
          onPress={onPressShareAddress}
        />
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
      </ModalFooterButtonsRow>
    </Animated.View>
  </Column>
);

ReceiveScreen.propTypes = {
  accountAddress: PropTypes.string.isRequired,
  drawerOpenProgress: PropTypes.object.isRequired,
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
