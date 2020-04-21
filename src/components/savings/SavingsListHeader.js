import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import { toRad, useTimingTransition } from 'react-native-redash';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { useAccountSettings } from '../../hooks';
import Highlight from '../Highlight';
import { ButtonPressAnimation, interpolate } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 44;

const sx = StyleSheet.create({
  emoji: {
    marginBottom: 3.5,
  },
  sumValue: {
    marginBottom: 1,
  },
});

const SavingsListHeader = ({
  emoji,
  highlight,
  isOpen,
  onPress,
  savingsSumValue,
  showSumValue,
}) => {
  const { nativeCurrency } = useAccountSettings();

  const animation = useTimingTransition(isOpen, {
    duration: TokenFamilyHeaderAnimationDuration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  return (
    <ButtonPressAnimation
      key={`${emoji}_${isOpen}`}
      onPress={onPress}
      scaleTo={1.05}
    >
      <Row
        align="center"
        height={TokenFamilyHeaderHeight}
        justify="space-between"
        paddingHorizontal={19}
        width="100%"
      >
        <Highlight visible={highlight} />
        <RowWithMargins align="center" margin={emoji ? 3.5 : 9}>
          <Emoji name={emoji} size="medium" style={sx.emoji} />
          <TruncatedText
            letterSpacing="roundedMedium"
            lineHeight="normal"
            size="large"
            weight="semibold"
          >
            Savings
          </TruncatedText>
        </RowWithMargins>
        <RowWithMargins align="center" margin={13}>
          {showSumValue && (
            <Animated.View
              style={{
                opacity: interpolate(animation, {
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              }}
            >
              <Text align="right" color="dark" size="large" style={sx.sumValue}>
                {convertAmountToNativeDisplay(savingsSumValue, nativeCurrency)}
              </Text>
            </Animated.View>
          )}
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
  isOpen: PropTypes.bool,
  onPress: PropTypes.func,
  savingsSumValue: PropTypes.string,
  showSumValue: PropTypes.bool,
};

SavingsListHeader.defaultProps = {
  emoji: 'sunflower',
  highlight: false,
  savingsSumValue: '0',
  showSumValue: false,
};

export default SavingsListHeader;
