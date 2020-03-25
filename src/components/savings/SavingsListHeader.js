import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import { toRad, useTimingTransition } from 'react-native-redash';
import { compose } from 'recompact';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
import { ButtonPressAnimation, interpolate } from '../animations';
import Highlight from '../Highlight';
import { Icon } from '../icons';
import { Row, RowWithMargins } from '../layout';
import { TruncatedText, Monospace } from '../text';
import withOpenSavings from '../../hoc/withOpenSavings';

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 50;

const SavingsListHeader = ({
  emoji,
  highlight,
  openSavings,
  savingsSumValue,
  setOpenSavings,
}) => {
  const animation = useTimingTransition(openSavings, {
    duration: TokenFamilyHeaderAnimationDuration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  return (
    <ButtonPressAnimation
      key={`${emoji}_${openSavings}`}
      onPress={() => setOpenSavings(!openSavings)}
      scaleTo={0.98}
    >
      <Row
        align="center"
        backgroundColor={colors.white}
        height={TokenFamilyHeaderHeight}
        justify="space-between"
        paddingHorizontal={19}
        width="100%"
      >
        <Highlight visible={highlight} />
        <RowWithMargins align="center" margin={emoji ? 5 : 9}>
          <Icon size="lmedium" name={emoji} />
          <TruncatedText
            letterSpacing="tight"
            lineHeight="normal"
            size="lmedium"
            style={{ marginBottom: 1 }}
            weight="semibold"
          >
            Savings
          </TruncatedText>
        </RowWithMargins>
        <RowWithMargins align="center" margin={14}>
          <Animated.View
            style={{
              opacity: interpolate(animation, {
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
            <Monospace color="dark" size="lmedium" style={{ marginBottom: 1 }}>
              ${Number(savingsSumValue).toFixed(2)}
            </Monospace>
          </Animated.View>
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
                    interpolate(animation, {
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
};

SavingsListHeader.animationDuration = TokenFamilyHeaderAnimationDuration;

SavingsListHeader.height = TokenFamilyHeaderHeight;

SavingsListHeader.propTypes = {
  emoji: PropTypes.string,
  highlight: PropTypes.bool,
  openSavings: PropTypes.bool,
  savingsSumValue: PropTypes.number,
  setOpenSavings: PropTypes.func,
};

SavingsListHeader.defaultProps = {
  emoji: 'sunflower',
};

export default compose(withOpenSavings)(SavingsListHeader);
