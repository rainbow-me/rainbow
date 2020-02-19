import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import EmojiSelector from '../components/avatar-builder/EmojiSelector';
import { Column, Row } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { colors } from '../styles';
import { deviceUtils } from '../utils';
import ColorCircle from '../components/avatar-builder/ColorCircle';
import store from '../redux/store';
import {
  settingsUpdateAccountName,
  settingsUpdateAccountColor,
} from '../redux/settings';
import { saveAccountInfo } from '../handlers/localstorage/accountLocal';
import { withAccountInfo } from '../hoc';

const { Value } = Animated;

const springConfig = {
  damping: 38,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 600,
};

const statusBarHeight = getStatusBarHeight(true);

const Container = styled(Column)`
  background-color: ${colors.transparent};
`;

const SheetContainer = styled(Column)`
  border-radius: 20px;
  background-color: ${colors.white};
  height: 420px;
  overflow: hidden;
  width: 100%;
`;

class AvatarBuilder extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      avatarColor:
        colors.avatarColor[this.props.navigation.getParam('accountColor', 4)],
      avatarColorIndex: this.props.navigation.getParam('accountColor', 4),
      emoji: this.props.navigation.getParam('accountName', '🙃'),
      position: new Value(
        (this.props.navigation.getParam('accountColor', 4) - 4) * 39
      ),
    };

    this.springAnim = new Value(
      (this.props.navigation.getParam('accountColor', 4) - 4) * 39
    );
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
      'mainnet'
    );
  };

  render() {
    const colorCircleTopPadding = 8;

    return (
      <Container {...deviceUtils.dimensions}>
        <TouchableBackdrop onPress={this.props.onPressBackground} />

        <Column
          align="center"
          pointerEvents="box-none"
          top={statusBarHeight + 46}
        >
          <View
            backgroundColor={this.state.avatarColor}
            borderRadius={32.5}
            height={65}
            marginBottom={5}
            shadowColor={colors.black}
            shadowOffset={{ height: 4, width: 0 }}
            shadowOpacity={0.2}
            shadowRadius={5}
            width={65}
          >
            <Text
              style={{
                fontSize: 38,
                height: 65,
                lineHeight: 65,
                textAlign: 'center',
                width: 65,
              }}
            >
              {this.state.emoji}
            </Text>
          </View>

          <Row
            justify="center"
            maxWidth={375}
            paddingBottom={17}
            paddingTop={colorCircleTopPadding}
            width="100%"
          >
            <Animated.View
              alignSelf="center"
              marginTop={-7}
              borderColor={this.state.avatarColor}
              borderRadius={19}
              borderWidth={3}
              height={38}
              position="absolute"
              style={{
                transform: [{ translateX: this.springAnim }],
              }}
              top={colorCircleTopPadding}
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
  withAccountInfo,
  withHandlers({
    onPressBackground: ({ navigation }) => () => navigation.goBack(),
  }),
  withNavigation
)(AvatarBuilder);
