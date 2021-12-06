import React from 'react';
import Animated, { EasingNode } from 'react-native-reanimated';
import { toRad, useTimingTransition } from 'react-native-redash/src/v1';
import styled from 'styled-components';
import CaretImageSource from '../../assets/family-dropdown-arrow.png';
import { ButtonPressAnimation, interpolate } from '../animations';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text, TruncatedText } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './TokenFamilyHeaderIcon' was resolved to '... Remove this comment to see the full error message
import TokenFamilyHeaderIcon from './TokenFamilyHeaderIcon';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const AnimatedImgixImage = Animated.createAnimatedComponent(ImgixImage);

export const TokenFamilyHeaderAnimationDuration = 200;
export const TokenFamilyHeaderHeight = 50;

const Content = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${({ isCoinRow }) => padding(0, isCoinRow ? 19 : 19)};
  background-color: ${({ theme: { colors } }) => colors.white};
  height: ${TokenFamilyHeaderHeight};
  width: 100%;
`;

const ChildrenAmountText = styled(Text).attrs({
  align: 'right',
  letterSpacing: 'roundedTight',
  size: 'large',
})`
  margin-bottom: 1;
`;

const RotatingArrowIcon = styled(AnimatedImgixImage).attrs(
  ({ theme: { colors } }) => ({
    resizeMode: ImgixImage.resizeMode.contain,
    source: CaretImageSource,
    tintColor: colors.dark,
  })
)`
  height: 18;
  margin-bottom: 1;
  right: 5;
  width: 8;
`;

const TitleText = styled(TruncatedText).attrs({
  align: 'left',
  letterSpacing: 'roundedMedium',
  lineHeight: 'normal',
  size: 'large',
  weight: 'heavy',
})`
  flex: 1;
  margin-bottom: 1;
  padding-left: ${({ isShowcase }) => (isShowcase ? 1 : 10)};
  padding-right: 9;
`;

const TokenFamilyHeader = ({
  childrenAmount,
  emoji,
  familyImage,
  isCoinRow,
  isOpen,
  onPress,
  testID,
  title,
}: any) => {
  const animation = useTimingTransition(!isOpen, {
    duration: TokenFamilyHeaderAnimationDuration,
    easing: EasingNode.bezier(0.25, 0.1, 0.25, 1),
  });

  const rotate = toRad(
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<number> | undefined... Remove this comment to see the full error message
    interpolate(animation, {
      inputRange: [0, 1],
      outputRange: [90, 0],
    })
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      key={`token_family_header_${emoji || familyImage || title}`}
      onPress={onPress}
      scaleTo={1.05}
      testID={testID}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content isCoinRow={isCoinRow}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins align="center" margin={emoji ? 5 : 9}>
          {emoji ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Emoji name={emoji} size="lmedium" />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <TokenFamilyHeaderIcon
              familyImage={familyImage}
              familyName={title}
              isCoinRow={isCoinRow}
            />
          )}
        </RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TitleText isShowcase={title === 'Showcase'}>{title}</TitleText>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins align="center" margin={10}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Animated.View style={{ opacity: animation }}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ChildrenAmountText>{childrenAmount}</ChildrenAmountText>
          </Animated.View>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <RotatingArrowIcon style={{ transform: [{ rotate }] }} />
        </RowWithMargins>
      </Content>
    </ButtonPressAnimation>
  );
};

export default React.memo(TokenFamilyHeader);
