import React, { PureComponent } from 'react';
import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import TouchableBackdrop from '../components/TouchableBackdrop';
import ColorCircle from '../components/avatar-builder/ColorCircle';
import EmojiSelector from '../components/avatar-builder/EmojiSelector';
import Header from '../components/header/Header';
import { Column, Row } from '../components/layout';
import { saveAccountInfo } from '../handlers/localstorage/accountLocal';
import { withAccountInfo, withAccountSettings } from '../hoc';
import {
  settingsUpdateAccountColor,
  settingsUpdateAccountName,
} from '../redux/settings';
import store from '../redux/store';
import { colors } from '../styles';
import { deviceUtils } from '../utils';

const { Value } = Animated;

const springConfig = {
  damping: 38,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 600,
};

const AvatarCircleHeight = 65;
const AvatarCircleMarginTop = 2;
const AvatarBuilderTopPoint =
  Header.heightWithStatusBar + AvatarCircleHeight + AvatarCircleMarginTop;

const Container = styled(Column)`
  background-color: ${colors.transparent};
`;

const SheetContainer = styled(Column)`
  background-color: ${colors.white};
  border-radius: 20px;
  height: 420px;
  overflow: hidden;
  width: 100%;
`;

class AvatarBuilder extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      avatarColor: colors.avatarColor[this.props.accountColor],
      avatarColorIndex: this.props.accountColor,
      emoji: this.props.accountName,
      position: new Value((this.props.accountColor - 4) * 39),
    };
    this.springAnim = new Value((this.props.accountColor - 4) * 39);
  }

  onChangeEmoji = event => {
    this.setState({ emoji: event });
    store.dispatch(settingsUpdateAccountName(event));
    this.saveInfo(event, this.state.avatarColorIndex);
  };

  avatarColors = colors.avatarColor.map((color, index) => (
    <ColorCircle
      backgroundColor={color}
      key={color}
      isSelected={index - 4 === 0}
      onPressColor={() => {
        let destination = (index - 4) * 39;
        Animated.spring(this.springAnim, {
          toValue: destination,
          ...springConfig,
        }).start();
        store.dispatch(settingsUpdateAccountColor(index));
        this.setState({
          avatarColor: color,
          avatarColorIndex: index,
        });
        this.saveInfo(this.state.emoji, index);
      }}
    />
  ));

  saveInfo = (name, color) => {
    saveAccountInfo(
      { color: color, name: name },
      this.props.accountAddress,
      this.props.network
    );
  };

  render() {
    const colorCircleTopPadding = 15;
    const colorCircleBottomPadding = 19;

    return (
      <Container {...deviceUtils.dimensions}>
        <TouchableBackdrop onPress={this.props.onPressBackground} />

        <Column
          align="center"
          pointerEvents="box-none"
          top={AvatarBuilderTopPoint}
        >
          <Row
            justify="center"
            maxWidth={375}
            height={38 + colorCircleTopPadding + colorCircleBottomPadding}
            paddingTop={colorCircleTopPadding + 7}
            paddingBottom={colorCircleBottomPadding + 7}
            width="100%"
          >
            <Animated.View
              alignSelf="center"
              borderColor={this.state.avatarColor}
              borderRadius={19}
              borderWidth={3}
              height={38}
              top={colorCircleTopPadding}
              position="absolute"
              style={{
                transform: [{ translateX: this.springAnim }],
              }}
              width={38}
            />
            {this.avatarColors}
          </Row>

          <SheetContainer>
            <EmojiSelector
              columns={7}
              onEmojiSelected={this.onChangeEmoji}
              showHistory={false}
              showSearchBar={false}
            />
          </SheetContainer>
        </Column>
      </Container>
    );
  }
}

export default compose(
  withAccountSettings,
  withAccountInfo,
  withHandlers({
    onPressBackground: ({ navigation }) => () => navigation.popToTop(),
  }),
  withNavigation
)(AvatarBuilder);
