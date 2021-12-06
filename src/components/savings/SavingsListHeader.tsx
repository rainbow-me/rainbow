import PropTypes from 'prop-types';
import React from 'react';
import Animated, { EasingNode } from 'react-native-reanimated';
import { toRad, useTimingTransition } from 'react-native-redash/src/v1';
import styled from 'styled-components';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { ButtonPressAnimation, interpolate } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';

const AnimatedImgixImage = Animated.createAnimatedComponent(ImgixImage);

const TokenFamilyHeaderAnimationDuration = 200;
const TokenFamilyHeaderHeight = 44;

const SumValueText = styled(Text).attrs({
  align: 'right',
  size: 'large',
})`
  margin-bottom: 1;
  color: ${({ theme: { colors } }) => colors.dark};
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
}: any) => {
  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();

  const animation = useTimingTransition(isOpen, {
    duration: TokenFamilyHeaderAnimationDuration,
    easing: EasingNode.bezier(0.25, 0.1, 0.25, 1),
  });
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      key={`${emoji}_${isOpen}`}
      marginBottom={title === 'Pools' ? -6 : 0}
      onPress={onPress}
      scaleTo={1.05}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row
        align="center"
        height={TokenFamilyHeaderHeight}
        justify="space-between"
        paddingHorizontal={19}
        width="100%"
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins align="center" margin={emoji ? 5 : 9}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ListHeaderEmoji name={emoji} />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TruncatedText
            color={colors.dark}
            letterSpacing="roundedMedium"
            lineHeight="normal"
            size="large"
            weight="heavy"
          >
            {title}
          </TruncatedText>
        </RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins align="center" margin={13}>
          {showSumValue && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Animated.View
              style={{
                opacity: interpolate(animation, {
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              }}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AnimatedImgixImage
            // @ts-expect-error ts-migrate(2322) FIXME: Type '{ resizeMode: any; source: StaticImageData; ... Remove this comment to see the full error message
            resizeMode={ImgixImage.resizeMode.contain}
            source={CaretImageSource}
            style={{
              height: 18,
              marginBottom: 1,
              right: 5,
              transform: [
                {
                  rotate: toRad(
                    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<number> | undefined... Remove this comment to see the full error message
                    interpolate(animation, {
                      inputRange: [0, 1],
                      outputRange: [0, 90],
                    })
                  ),
                },
              ],
              width: 8,
            }}
            tintColor={colors.dark}
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
