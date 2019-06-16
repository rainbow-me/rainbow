import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Clipboard, Share } from 'react-native';
import Animated from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { DrawerActions } from 'react-navigation';
import { compose, onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import CopyTooltip from '../components/CopyTooltip';
import FloatingPanel from '../components/expanded-state/FloatingPanel';
import { FloatingEmojis } from '../components/floating-emojis';
import { Centered, Column } from '../components/layout';
import { ModalFooterButton, ModalFooterButtonsRow } from '../components/modal';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { AnimatedShadowItem, ShadowStack } from '../components/shadow-stack';
import { Br, Monospace, Text } from '../components/text';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { withAccountAddress } from '../hoc';
import { colors, padding, position } from '../styles';
import { deviceUtils, safeAreaInsetValues, statusBar } from '../utils';

const {
  block,
  call,
  interpolate,
  lessOrEq,
  onChange,
} = Animated;

const QRCodeSize = 219;
const QRCodePadding = 16;
const QRCodeImageSize = QRCodeSize - (QRCodePadding * 2);

const AddressText = styled(Monospace).attrs({
  align: 'center',
  color: 'white',
  lineHeight: 'loose',
})`
  font-size: 14.4;
  width: ${QRCodeImageSize};
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
const HandleTabUpdate = ({ drawerOpenProgress, tab, tooltipRef }) => {
  const endThreshold = 0.01;

  const isDrawerAnimationEnding = lessOrEq(drawerOpenProgress, endThreshold);
  const isDrawerOpen = lessOrEq(drawerOpenProgress, 0.99);

  const forceUpdateTab = call([drawerOpenProgress], ([p]) => {
    const underThreshold = p <= endThreshold;
    const statusBarStyle = underThreshold ? 'dark-content' : 'light-content';
    statusBar.setBarStyle(statusBarStyle, true);
    tab.tabActiveOffsetX[0] = underThreshold ? -20 : -10000;
    tab.tabActiveOffsetX[1] = underThreshold ? 20 : 10000;
    tab.tabRef.current.forceUpdate();
  });

  // Hide tooltip if tab changes
  const closeTooltip = call([drawerOpenProgress], () => {
    tooltipRef.current.handleHideTooltip();
  });

  return (
    <Animated.Code>
      {() => block([
        onChange(isDrawerAnimationEnding, forceUpdateTab),
        onChange(isDrawerOpen, closeTooltip),
      ])}
    </Animated.Code>
  );
};

HandleTabUpdate.propTypes = {
  drawerOpenProgress: PropTypes.object,
  tab: PropTypes.object,
  tooltipRef: PropTypes.object,
};

class ReceiveModal extends PureComponent {
  static propTypes = {
    accountAddress: PropTypes.string.isRequired,
    drawerOpenProgress: PropTypes.object.isRequired,
    navigation: PropTypes.object.isRequired,
    onCloseModal: PropTypes.func.isRequired,
    onPressShareAddress: PropTypes.func,
    tab: PropTypes.object,
  }

  state = {
    emojiCount: 0,
  }

  tooltipRef = React.createRef()

  componentDidMount() {
    const { drawerOpenProgress, navigation } = this.props;
    navigation.setParams({ drawerOpenProgress });
  }

  handleCloseModal = () => this.props.navigation.dispatch(DrawerActions.closeDrawer())

  handlePressCopyAddress = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    this.setState(({ emojiCount }) => ({ emojiCount: emojiCount + 1 }));
    Clipboard.setString(this.props.accountAddress);
  }

  handlePressShareAddress = () => {
    Share.share({
      message: this.props.accountAddress,
      title: 'My account address:',
    });
  }

  renderFooter = () => {
    const translateX = interpolate(this.props.drawerOpenProgress, ({
      inputRange: [0, 1],
      outputRange: [deviceUtils.dimensions.width, 0],
    }));

    const translateY = interpolate(this.props.drawerOpenProgress, ({
      inputRange: [0, 0.9, 1],
      outputRange: [110, 110, 0],
    }));

    return (
      <Animated.View
        shouldRasterizeIOS
        style={{
          bottom: safeAreaInsetValues.bottom + 20,
          transform: [{ translateY }, { translateX }],
        }}
      >
        <ShadowStack
          backgroundColor={colors.dark}
          borderRadius={ModalFooterButtonsRow.borderRadius}
          height={ModalFooterButton.height}
          overflow="visible"
          shadows={[
            [0, 3, 5, colors.dark, 0.2],
            [0, 6, 10, colors.dark, 0.14],
            [0, 1, 18, colors.dark, 0.12],
          ]}
          width={257}
        >
          <ModalFooterButtonsRow>
            <ModalFooterButton
              icon="share"
              label="Share"
              onPress={this.handlePressShareAddress}
            />
            <Column flex={0}>
              <ModalFooterButton
                icon="copy"
                label="Copy"
                onPress={this.handlePressCopyAddress}
              />
              <FloatingEmojis
                count={this.state.emojiCount}
                distance={130}
                emoji="+1"
                size="h2"
              />
            </Column>
          </ModalFooterButtonsRow>
        </ShadowStack>
      </Animated.View>
    );
  }

  renderJustifiedAddress = () => {
    const { accountAddress } = this.props;
    const halfAddressRegEx = new RegExp(`.{${accountAddress.length / 2}}`, 'g');
    const addressSegments = accountAddress.match(halfAddressRegEx);

    return (
      <Centered
        direction="column"
        marginTop={12}
        opacity={0.4}
        width={QRCodeSize}
      >
        {addressSegments.map((addressSegment) => (
          <AddressText key={addressSegment}>
            {addressSegment}
          </AddressText>
        ))}
      </Centered>
    );
  }

  renderQRCode = () => (
    <ShadowStack
      backgroundColor={colors.white}
      borderRadius={FloatingPanel.borderRadius}
      height={QRCodeSize}
      itemStyles={{
        opacity: interpolate(this.props.drawerOpenProgress, ({
          inputRange: [0.85, 1],
          outputRange: [0, 1],
        })),
      }}
      renderItem={AnimatedShadowItem}
      shadows={[[0, 10, 50, colors.dark, 0.5]]}
      width={QRCodeSize}
    >
      <FloatingPanel css={padding(QRCodePadding)}>
        <QRCodeDisplay
          size={QRCodeImageSize}
          value={this.props.accountAddress}
        />
      </FloatingPanel>
    </ShadowStack>
  )

  render = () => (
    <Centered css={position.size('100%')} direction="column">
      <HandleTabUpdate
        drawerOpenProgress={this.props.drawerOpenProgress}
        tab={this.props.tab}
        tooltipRef={this.tooltipRef}
      />
      <TouchableBackdrop onPress={this.handleCloseModal} />
      <Centered
        css={padding(25)}
        direction="column"
        flex={1}
        pointerEvents="box-none"
      >
        <DescriptionText>
          Send Ether, ERC-20 tokens,<Br />
          or collectibles to your wallet:
        </DescriptionText>
        <CopyTooltip
          activeOpacity={1}
          arrowDirection="up"
          onRef={this.tooltipRef}
          textToCopy={this.props.accountAddress}
          tooltipText="Copy Address"
        >
          {this.renderQRCode()}
          {this.renderJustifiedAddress()}
        </CopyTooltip>
      </Centered>
      {this.renderFooter()}
    </Centered>
  )
}

export default compose(
  withAccountAddress,
  onlyUpdateForKeys(['accountAddress']),
)(ReceiveModal);
