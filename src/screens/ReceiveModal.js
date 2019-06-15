import PropTypes from 'prop-types';
import React from 'react';
import { Clipboard, Share } from 'react-native';
import Animated from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  compose,
  lifecycle,
  onlyUpdateForKeys,
  withHandlers,
  withState,
} from 'recompact';
import styled from 'styled-components/primitives';
import { Centered, Column } from '../components/layout';
import {
  ModalFooterButton,
  ModalFooterButtonsRow,
} from '../components/modal';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { FloatingEmojis } from '../components/floating-emojis';
import { Br, Monospace, Text } from '../components/text';
import { withAccountAddress } from '../hoc';
import { colors, padding, position } from '../styles';
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

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: 'white',
  lineHeight: 'loose',
  weight: 'medium',
})`
  margin-bottom: 22;
`;

/**
 * There's need to block tab interaction if drawer is open.
 * We managed to do that by overriding activeOffsetProperty for extremely
 * large and then forcing update of gesture handler beneath.
 */
const HandleTabUpdate = ({ tab, drawerOpenProgress }) => {
  const threshold = 0.01;

  const isDrawerOpen = Animated.lessOrEq(drawerOpenProgress, threshold);

  const forceUpdateTab = Animated.call([drawerOpenProgress], ([p]) => {
    tab.tabActiveOffsetX[0] = p <= threshold ? -20 : -10000;
    tab.tabActiveOffsetX[1] = p <= threshold ? 20 : 10000;
    tab.tabRef.current.forceUpdate();
  });

  return <Animated.Code exec={Animated.onChange(isDrawerOpen, forceUpdateTab)} />;
};

HandleTabUpdate.propTypes = {
  drawerOpenProgress: PropTypes.object,
  tab: PropTypes.object,
};

const ReceiveScreen = ({
  accountAddress,
  drawerOpenProgress,
  emojiCount,
  onCloseModal,
  onPressCopyAddress,
  onPressShareAddress,
  tab,
}) => {
  const translateX = Animated.interpolate(drawerOpenProgress, ({
    inputRange: [0, 1],
    outputRange: [deviceUtils.dimensions.width, 0],
  }));

  const translateY = Animated.interpolate(drawerOpenProgress, ({
    inputRange: [0, 0.9, 1],
    outputRange: [110, 110, 0],
  }));

  return (
    <Centered direction="column" {...position.sizeAsObject('100%')}>
      <Centered
        css={padding(25)}
        direction="column"
        flex={1}
      >
        <DescriptionText>
          Send Ether, ERC-20 tokens,<Br />
          or collectibles to your wallet:
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
      </Centered>
      <Animated.View style={{ transform: [{ translateY }, { translateX }] }}>
        <ModalFooterButtonsRow>
          <ModalFooterButton
            icon="share"
            label="Share"
            onPress={onPressShareAddress}
          />
          <Column flex={0}>
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
      <HandleTabUpdate
        drawerOpenProgress={drawerOpenProgress}
        tab={tab}
      />
    </Centered>
  );
};

ReceiveScreen.propTypes = {
  accountAddress: PropTypes.string.isRequired,
  drawerOpenProgress: PropTypes.object.isRequired,
  emojiCount: PropTypes.number,
  navigation: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  onPressCopyAddress: PropTypes.func,
  onPressShareAddress: PropTypes.func,
  tab: PropTypes.object,
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
  lifecycle({
    componentDidMount() {
      const { navigation, drawerOpenProgress } = this.props;
      navigation.setParams({ drawerOpenProgress });
    },
  }),
  onlyUpdateForKeys(['accountAddress', 'emojiCount']),
)(ReceiveScreen);
