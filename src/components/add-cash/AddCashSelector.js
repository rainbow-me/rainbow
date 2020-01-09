// import PropTypes from 'prop-types';
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import styled from 'styled-components/primitives';
import RadialGradient from 'react-native-radial-gradient';
import { colors, fonts } from '../../styles';
import { CoinIcon } from '../coin-icon';

const { Clock, Value } = Animated;

const maxWidth = 300;
const bottomSpaceWidth =
  (deviceUtils.dimensions.width > maxWidth
    ? maxWidth
    : deviceUtils.dimensions.width) /
  (3 * 2);
const gradientXRadius = deviceUtils.dimensions.width - 48;
const gradientXPoint = deviceUtils.dimensions.width - 48;
const gradientPoints = [gradientXPoint, 53.5];

const componentWidths = [90, 85, 105];
const positionDiff = (componentWidths[0] - componentWidths[2]) / 2;
const centerDiff =
  (componentWidths[1] -
    (componentWidths[2] > componentWidths[0]
      ? componentWidths[0]
      : componentWidths[2])) /
  2;
const componentPositions = [
  -componentWidths[1] +
    (componentWidths[2] > componentWidths[0] ? positionDiff : 0) +
    centerDiff,
  positionDiff,
  componentWidths[1] +
    (componentWidths[0] > componentWidths[2] ? positionDiff : 0) -
    centerDiff,
];

const springConfig = {
  damping: 46,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 800,
};

const { sub, multiply } = Animated;

const MiniCoinIcon = styled(CoinIcon).attrs({
  alignSelf: 'center',
  size: 26,
})`
  margin-left: 7px;
`;

const CoinText = styled(Text)`
  color: ${colors.alpha(colors.blueGreyDark, 0.5)};
  font-family: ${fonts.family.SFProRounded};
  font-size: ${fonts.size.large};
  font-weight: ${fonts.weight.semibold};
  height: 40px;
  letter-spacing: ${fonts.letterSpacing.looseyGoosey};
  line-height: 39px;
  margin-left: 6px;
  margin-right: 11px;
  text-align: center;
`;

class AddCashSelector extends React.Component {
  propTypes = {
    // onPress: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.clock = new Clock();
    this.widthClock = new Clock();
    this.translateX = new Value(componentPositions[1]);
    this.width = new Value(componentWidths[1]);
    this.destinatedWidth = new Value(componentWidths[1]);

    this.state = {
      currentOption: 1,
    };
  }

  animateTransition = index => {
    Animated.spring(this.translateX, {
      toValue: componentPositions[index],
      ...springConfig,
    }).start();
    Animated.timing(this.width, {
      duration: 150,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      toValue: componentWidths[index],
    }).start();
  };

  onSelectFirst = () => {
    this.animateTransition(0);
    setTimeout(() => {
      this.setState({ currentOption: 0 });
    }, 75);
    // this.props.onPress(0);
  };

  onSelectSecond = () => {
    this.animateTransition(1);
    setTimeout(() => {
      this.setState({ currentOption: 1 });
    }, 75);
    // this.props.onPress(1);
  };

  onSelectThird = () => {
    this.animateTransition(2);
    setTimeout(() => {
      this.setState({ currentOption: 2 });
    }, 75);
    // this.props.onPress(2);
  };

  render() {
    return (
      <>
        <Animated.View
          style={[
            {
              backgroundColor: colors.white,
              borderRadius: 20,
              marginBottom: -40,
              shadowColor: colors.blueGreyDark,
              shadowOffset: { height: 0, width: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              zIndex: 10,
            },
            {
              transform: [{ translateX: this.translateX }],
              width: this.width,
            },
          ]}
        >
          <View
            style={{
              borderRadius: 20,
              height: 40,
              overflow: 'hidden',
              shadowOpacity: 0,
            }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    translateX: sub(
                      multiply(this.translateX, -1),
                      bottomSpaceWidth * 2.2
                    ),
                  },
                ],
              }}
            >
              <RadialGradient
                center={gradientPoints}
                colors={['#00F0FF', '#FFB114', '#aaa']}
                opacity={0}
                radius={gradientXRadius}
                style={{
                  height: 40,
                  position: 'absolute',
                  width: deviceUtils.dimensions.width,
                }}
                stops={[0.2049, 0.6354, 0.8318, 0.9541]}
              />
            </Animated.View>
          </View>
        </Animated.View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            maxWidth,
            width: deviceUtils.dimensions.width,
            zIndex: 11,
          }}
        >
          <ButtonPressAnimation
            onPress={this.onSelectFirst}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              width: componentWidths[0],
            }}
          >
            <MiniCoinIcon symbol="ETH" />
            <CoinText
              style={{
                color:
                  this.state.currentOption === 0
                    ? colors.alpha(colors.blueGreyDark, 0.7)
                    : colors.alpha(colors.blueGreyDark, 0.5),
              }}
            >
              ETH
            </CoinText>
          </ButtonPressAnimation>
          <ButtonPressAnimation
            onPress={this.onSelectSecond}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              width: componentWidths[1],
            }}
          >
            <MiniCoinIcon symbol="DAI" />
            <CoinText
              style={{
                color:
                  this.state.currentOption === 1
                    ? colors.alpha(colors.blueGreyDark, 0.7)
                    : colors.alpha(colors.blueGreyDark, 0.5),
              }}
            >
              DAI
            </CoinText>
          </ButtonPressAnimation>
          <ButtonPressAnimation
            onPress={this.onSelectThird}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              width: componentWidths[2],
            }}
          >
            <MiniCoinIcon symbol="USDC" />
            <CoinText
              style={{
                color:
                  this.state.currentOption === 2
                    ? colors.alpha(colors.blueGreyDark, 0.7)
                    : colors.alpha(colors.blueGreyDark, 0.5),
              }}
            >
              USDC
            </CoinText>
          </ButtonPressAnimation>
        </View>
      </>
    );
  }
}

export default AddCashSelector;
