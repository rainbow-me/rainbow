// import PropTypes from 'prop-types';
import React from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { ShadowStack } from '../shadow-stack';

const { Value } = Animated;

const maxWidth = 300;

const componentWidths = [94, 88, 109];
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
  damping: 38,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 600,
};

const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

const MiniCoinIcon = styled(CoinIcon).attrs({
  alignSelf: 'center',
  size: 26,
})`
  margin-left: 7px;
`;

const CoinButtonShadow = [
  [0, 0, 9, colors.shadowGrey, 0.1],
  [0, 5, 15, colors.shadowGrey, 0.12],
  [0, 10, 30, colors.shadowGrey, 0.06],
];

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

    this.translateX = new Value(componentPositions[1]);
    this.width = new Value(componentWidths[1]);

    this.state = {
      currentOption: 1,
    };
  }

  animateTransition = index => {
    Animated.spring(this.translateX, {
      toValue: componentPositions[index],
      ...springConfig,
    }).start();
    Animated.spring(this.width, {
      toValue: componentWidths[index],
      ...springConfig,
    }).start();
  };

  onSelectFirst = () => {
    this.animateTransition(0);
    this.setState({ currentOption: 0 });
    // this.props.onPress(0);
  };

  onSelectSecond = () => {
    this.animateTransition(1);
    this.setState({ currentOption: 1 });
    // this.props.onPress(1);
  };

  onSelectThird = () => {
    this.animateTransition(2);
    this.setState({ currentOption: 2 });
    // this.props.onPress(2);
  };

  render() {
    return (
      <>
        <AnimatedShadowStack
          borderRadius={20}
          height={40}
          marginLeft={4}
          marginRight={4}
          shadows={CoinButtonShadow}
          style={[
            {
              marginBottom: -40,
              zIndex: 10,
            },
            {
              transform: [{ translateX: this.translateX }],
              width: this.width,
            },
          ]}
        />
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
            enableHapticFeedback={false}
            onPress={this.onSelectFirst}
            scaleTo={0.94}
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
            enableHapticFeedback={false}
            onPress={this.onSelectSecond}
            scaleTo={0.94}
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
            enableHapticFeedback={false}
            onPress={this.onSelectThird}
            scaleTo={0.94}
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
