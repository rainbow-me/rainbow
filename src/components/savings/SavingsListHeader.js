import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import { toRad, useTimingTransition } from 'react-native-redash';
import { useDispatch } from 'react-redux';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { useAccountData, useOpenSavings } from '../../hooks';
import { ButtonPressAnimation, interpolate } from '../animations';
import Highlight from '../Highlight';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 44;

const SavingsListHeader = ({ emoji, highlight, savingsSumValue }) => {
  const animation = useTimingTransition(openSavings, {
    duration: TokenFamilyHeaderAnimationDuration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const { nativeCurrency } = useAccountData();
  const { openSavings, setOpenSavings } = useOpenSavings();
  const dispatch = useDispatch();

  const onPress = useCallback(() => dispatch(setOpenSavings(!openSavings)), [
    dispatch,
    openSavings,
    setOpenSavings,
  ]);

  return (
    <ButtonPressAnimation
      key={`${emoji}_${openSavings}`}
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
          <Emoji name={emoji} size="medium" style={{ marginBottom: 3.5 }} />
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
          <Animated.View
            style={{
              opacity: interpolate(animation, {
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
            <Text
              align="right"
              color="dark"
              size="large"
              style={{ marginBottom: 1 }}
            >
              {convertAmountToNativeDisplay(savingsSumValue, nativeCurrency)}
            </Text>
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
  savingsSumValue: PropTypes.number,
};

SavingsListHeader.defaultProps = {
  emoji: 'sunflower',
  savingsSumValue: 0,
  showSumValue: false,
};

export default SavingsListHeader;
