import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import { toRad, useTimingTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { useAccountSettings } from '../../hooks';

import { ButtonPressAnimation, interpolate } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 44;

const SumValueText = styled(Text).attrs({
  align: 'right',
  size: 'large',
})`
  margin-bottom: 1;
`;

const ListHeaderEmoji = styled(Emoji).attrs({ size: 'medium' })`
  margin-bottom: 3.5;
`;

const SavingsListHeader = ({
  emoji,
  isOpen,
  onPress,
  savingsSumValue,
  showSumValue,
  title,
}) => {
  const { nativeCurrency } = useAccountSettings();

  const animation = useTimingTransition(isOpen, {
    duration: TokenFamilyHeaderAnimationDuration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
  return (
    <ButtonPressAnimation
      key={`${emoji}_${isOpen}`}
      marginBottom={title === 'Pools' ? -6 : 0}
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
        <RowWithMargins align="center" margin={emoji ? 5 : 9}>
          <ListHeaderEmoji name={emoji} />
          <TruncatedText
            letterSpacing="roundedMedium"
            lineHeight="normal"
            size="large"
            weight="bold"
          >
            {title}
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
              <SumValueText>
                {Number(savingsSumValue) || Number(savingsSumValue) === 0
                  ? convertAmountToNativeDisplay(
                      savingsSumValue,
                      nativeCurrency
                    )
                  : savingsSumValue}
              </SumValueText>
            </Animated.View>
          )}
          <AnimatedFastImage
            resizeMode={FastImage.resizeMode.contain}
            source={CaretImageSource}
            style={{
              height: 18,
              marginBottom: 1,
              right: 5,
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
              width: 8,
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
  isOpen: PropTypes.bool,
  onPress: PropTypes.func,
  savingsSumValue: PropTypes.string,
  showSumValue: PropTypes.bool,
  title: PropTypes.string,
};

SavingsListHeader.defaultProps = {
  emoji: 'sunflower',
  savingsSumValue: '0',
  showSumValue: false,
  title: 'Savings',
};

export default SavingsListHeader;
