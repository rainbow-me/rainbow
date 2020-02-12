import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import { toRad } from 'react-native-redash';
import { toClass, withProps } from 'recompact';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { borders, colors } from '../../styles';
import { initials, isNewValueForPath } from '../../utils';
import { ButtonPressAnimation, interpolate } from '../animations';
import Highlight from '../Highlight';
import ImageWithCachedDimensions from '../ImageWithCachedDimensions';
import { Row, RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { TruncatedText, Monospace } from '../text';

const { timing, Value } = Animated;

const AnimatedMonospace = Animated.createAnimatedComponent(toClass(Monospace));
const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 50;

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
  };

  componentDidUpdate = prevProps => {
    if (isNewValueForPath(this.props, prevProps, 'isOpen')) {
      this.runTiming();
    }
  };

  static animationDuration = TokenFamilyHeaderAnimationDuration;

  static height = TokenFamilyHeaderHeight;

  animation = new Value(this.props.isOpen ? 1 : 0);

  runTiming = () =>
    timing(this.animation, {
      duration: TokenFamilyHeaderAnimationDuration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      toValue: this.props.isOpen ? 1 : 0,
    }).start();

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
        {familyImage ? (
          <FamilyIcon familyImage={familyImage} style={size} />
        ) : (
          <FallbackIcon {...size} symbol={initials(familyName)} />
        )}
      </ShadowStack>
    );
  };

  render = () => (
    <ButtonPressAnimation onPress={this.props.onHeaderPress} scaleTo={0.98}>
      <Row
        align="center"
        backgroundColor={colors.white}
        height={TokenFamilyHeaderHeight}
        justify="space-between"
        paddingHorizontal={this.props.isCoinRow ? 16 : 19}
        width="100%"
      >
        <Highlight visible={this.props.highlight} />
        <RowWithMargins align="center" margin={10}>
          {this.renderFamilyIcon()}
          <TruncatedText
            letterSpacing="tight"
            lineHeight="normal"
            size="lmedium"
            style={{ marginBottom: 1 }}
            weight="semibold"
          >
            {this.props.familyName}
          </TruncatedText>
        </RowWithMargins>
        <RowWithMargins align="center" margin={14}>
          <AnimatedMonospace
            color="dark"
            size="lmedium"
            style={{
              marginBottom: 1,
              opacity: interpolate(this.animation, {
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
            {this.props.childrenAmount}
          </AnimatedMonospace>
          <AnimatedFastImage
            resizeMode={FastImage.resizeMode.contain}
            source={CaretImageSource}
            style={{
              height: 17,
              marginBottom: 1,
              right: 4,
              transform: [
                {
                  rotate: toRad(
                    interpolate(this.animation, {
                      inputRange: [0, 1],
                      outputRange: [0, 90],
                    })
                  ),
                },
              ],
              width: 9,
            }}
          />
        </RowWithMargins>
      </Row>
    </ButtonPressAnimation>
  );
}
