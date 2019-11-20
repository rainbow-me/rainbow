import MaskedView from '@react-native-community/masked-view';
import React, { Component } from 'react';
import { StatusBar, View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import RadialGradient from 'react-native-radial-gradient';
import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { compose, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import {
  AddCashHeader,
  ApplePayButton,
  VirtualKeyboard,
} from '../components/add-cash';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { withTransitionProps } from '../hoc';
import { borders, colors, padding } from '../styles';
import { deviceUtils, safeAreaInsetValues } from '../utils';
import AddCashSelector from '../components/add-cash/AddCashSelector';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';

const {
  set,
  cond,
  startClock,
  clockRunning,
  block,
  spring,
  Value,
  Clock,
} = Animated;

function runSpring(clock, value, dest, velocity, stiffness, damping) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = {
    damping: new Value(0),
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: new Value(0),
    toValue: new Value(0),
  };

  return block([
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.velocity, velocity),
      set(config.toValue, dest),
      set(config.damping, damping),
      set(config.stiffness, stiffness),
      startClock(clock),
    ]),
    spring(clock, state, config),
    state.position,
  ]);
}

const cashLimit = 1500;

const cashFontSize = deviceUtils.dimensions.width * 0.24;
const isTinyIphone = deviceUtils.dimensions.width < 375 ? true : false;
const keyboardWidth = isTinyIphone ? 275 : '100%';

const statusBarHeight = getStatusBarHeight(true);
const sheetHeight = isNativeStackAvailable
  ? deviceUtils.dimensions.height - statusBarHeight - 10
  : deviceUtils.dimensions.height - statusBarHeight;

const gradientXPoint = deviceUtils.dimensions.width - 48;
const gradientPoints = [gradientXPoint, 53.5];

const Container = isNativeStackAvailable
  ? styled(Column)`
      background-color: ${colors.transparent};
      height: ${sheetHeight};
    `
  : styled(Column)`
      background-color: ${colors.transparent};
      height: 100%;
    `;

const SheetContainer = isNativeStackAvailable
  ? styled(Column)`
      background-color: ${colors.white};
      height: ${deviceUtils.dimensions.height};
    `
  : styled(Column)`
      ${borders.buildRadius('top', 30)};
      background-color: ${colors.white};
      height: ${sheetHeight};
      top: ${statusBarHeight};
    `;

class AddCashSheet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      coinButtonWidth: 80,
      coinButtonX: 98,
      scaleAnim: 1,
      shakeAnim: 0,
      text: null,
    };
  }

  onPress(val) {
    let curText = this.state.text;
    if (!curText) {
      if (val === '0' || isNaN(val)) {
        this.setState({
          shakeAnim: runSpring(new Clock(), -10, 0, -1000, 5500, 35),
        });
        return;
      } else curText = val;
    } else if (isNaN(val)) {
      if (val === 'back') {
        curText = curText.slice(0, -1);
      } else if (curText.includes('.')) {
        this.setState({
          shakeAnim: runSpring(new Clock(), -10, 0, -1000, 5500, 35),
        });
        return;
      } else curText += val;
    } else {
      if (curText.charAt(curText.length - 3) === '.') {
        this.setState({
          shakeAnim: runSpring(new Clock(), -10, 0, -1000, 5500, 35),
        });
        return;
      } else if (curText + val <= cashLimit) {
        curText += val;
      } else {
        this.setState({
          shakeAnim: runSpring(new Clock(), -10, 0, -1000, 5500, 35),
        });
        return;
      }
    }
    let prevPosition = 1;
    if (this.state.text && this.state.text.length > 3) {
      prevPosition = 1 - (this.state.text.length - 3) * 0.075;
    }
    if (curText.length > 3) {
      let characterCount = 1 - (curText.length - 3) * 0.075;
      this.setState({
        scaleAnim: runSpring(
          new Clock(),
          prevPosition,
          characterCount,
          0,
          400,
          40
        ),
      });
    } else if (curText.length == 3) {
      this.setState({
        scaleAnim: runSpring(new Clock(), prevPosition, 1, 0, 400, 40),
      });
    }
    this.setState({ text: curText });
  }

  render() {
    return (
      <SheetContainer>
        <StatusBar barStyle="light-content" />
        <Container align="center" justify="space-between">
          <AddCashHeader />
          <ColumnWithMargins
            align="center"
            css={padding(0, 24, isTinyIphone ? 0 : 24)}
            margin={8}
            width="100%"
          >
            <MaskedView
              width="100%"
              maskElement={
                <Animated.View>
                  <Animated.Text
                    style={{
                      color: colors.white,
                      fontFamily: 'SF Pro Rounded',
                      fontSize: cashFontSize,
                      fontWeight: 'bold',
                      left: '-50%',
                      lineHeight: 108,
                      textAlign: 'center',
                      transform: [
                        {
                          scale: this.state.scaleAnim,
                          translateX: this.state.shakeAnim,
                        },
                      ],
                      width: '200%',
                    }}
                  >
                    {'$' + (this.state.text ? this.state.text : '0')}
                  </Animated.Text>
                </Animated.View>
              }
            >
              <RadialGradient
                center={gradientPoints}
                colors={['#FFB114', '#FF54BB', '#00F0FF', '#34F3FF']}
                radius={gradientXPoint}
                style={{ height: 108, width: '100%' }}
                stops={[0.2049, 0.6354, 0.8318, 0.9541]}
              />
            </MaskedView>

            <AddCashSelector />
          </ColumnWithMargins>

          <ColumnWithMargins align="center" margin={15}>
            <View style={{ maxWidth: 313 }}>
              <VirtualKeyboard
                decimal="true"
                pressMode="char"
                rowStyle={{ width: keyboardWidth }}
                onPress={val => this.onPress(val)}
              />
            </View>
            <Centered
              css={padding(
                isTinyIphone ? 4 : 24,
                15,
                isTinyIphone ? 15 : safeAreaInsetValues.bottom + 21
              )}
              width="100%"
            >
              <ApplePayButton disabled={false} />
            </Centered>
          </ColumnWithMargins>
        </Container>
      </SheetContainer>
    );
  }
}

export default compose(
  withNavigation,
  withTransitionProps,
  withProps(({ transitionProps: { isTransitioning } }) => ({
    isTransitioning,
  }))
)(AddCashSheet);
