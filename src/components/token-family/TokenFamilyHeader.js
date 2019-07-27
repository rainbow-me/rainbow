import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import { toRad } from 'react-native-redash';
import { toClass, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { borders, colors, padding } from '../../styles';
import { initials, isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import Highlight from '../Highlight';
import ImageWithCachedDimensions from '../ImageWithCachedDimensions';
import { Row, RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { TruncatedText, Monospace } from '../text';

const { interpolate, timing, Value } = Animated;

const AnimatedMonospace = Animated.createAnimatedComponent(toClass(Monospace));
const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 54;

const FamilyIcon = withProps(({ familyImage }) => ({
  id: familyImage,
  source: { uri: familyImage },
}))(ImageWithCachedDimensions);

export default class TokenFamilyHeader extends PureComponent {
  static propTypes = {
    childrenAmount: PropTypes.number,
    familyImage: PropTypes.string,
    familyName: PropTypes.string,
    highlight: PropTypes.bool,
    isCoinRow: PropTypes.bool,
    isOpen: PropTypes.bool,
    onHeaderPress: PropTypes.func,
  }

  static animationDuration = TokenFamilyHeaderAnimationDuration;

  static height = TokenFamilyHeaderHeight;

  animation = new Value(0)

  componentDidMount = () => this.runTiming()

  componentDidUpdate = (prevProps) => {
    if (isNewValueForPath(this.props, prevProps, 'isOpen')) {
      this.runTiming();
    }
  }

  runTiming = () => (
    timing(this.animation, {
      duration: TokenFamilyHeaderAnimationDuration,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      toValue: this.props.isOpen ? 1 : 0,
    }).start()
  )

  renderFamilyIcon = () => {
    const { familyImage, familyName, isCoinRow } = this.props;
    const size = borders.buildCircleAsObject(isCoinRow ? 40 : 32);

    return (
      <ShadowStack
        {...size}
        backgroundColor={familyImage ? colors.white : colors.purpleLight}
        shadows={[
          [0, 4, 6, colors.dark, 0.04],
          [0, 1, 3, colors.dark, 0.08],
        ]}
      >
        {familyImage
          ? <FamilyIcon familyImage={familyImage} style={size} />
          : <FallbackIcon {...size} symbol={initials(familyName)} />
        }
      </ShadowStack>
    );
  }

  render = () => (
    <ButtonPressAnimation
      onPress={this.props.onHeaderPress}
      scaleTo={0.96}
    >
      <Row
        align="center"
        backgroundColor={colors.white}
        height={TokenFamilyHeaderHeight}
        justify="space-between"
        paddingHorizontal={this.props.isCoinRow ? 16 : 19}
        paddingVertical={7.5}
        width="100%"
      >
        <Highlight visible={this.props.highlight} />
        <RowWithMargins align="center" margin={9}>
          {this.renderFamilyIcon()}
          <TruncatedText
            lineHeight="normal"
            size="medium"
            weight="semibold"
          >
            {this.props.familyName}
          </TruncatedText>
          <AnimatedFastImage
            resizeMode={FastImage.resizeMode.contain}
            source={CaretImageSource}
            style={{
              height: 15,
              transform: [{
                rotate: toRad(interpolate(this.animation, {
                  inputRange: [0, 1],
                  outputRange: [0, 90],
                })),
              }],
              width: 5.84,
            }}
          />
        </RowWithMargins>
        <AnimatedMonospace
          color="blueGreyDark"
          size="lmedium"
          style={{
            opacity: interpolate(this.animation, {
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }}
        >
          {this.props.childrenAmount}
        </AnimatedMonospace>
      </Row>
    </ButtonPressAnimation>
  )
}
