import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation, ShimmerAnimation } from '../animations';
import { ColumnWithMargins, RowWithMargins } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './TokenInfoBalanceValue' was resolved to '... Remove this comment to see the full error message
import TokenInfoBalanceValue from './TokenInfoBalanceValue';
import TokenInfoHeading from './TokenInfoHeading';
import TokenInfoValue from './TokenInfoValue';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/context' or its co... Remove this comment to see the full error message
import { useTheme } from '@rainbow-me/context';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDelayedValueWithLayoutAnimation } from '@rainbow-me/hooks';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View``;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const VerticalDivider = styled.View`
  background-color: ${({ theme: { colors } }: any) =>
    colors.rowDividerExtraLight};
  border-radius: 1;
  height: 40;
  margin-top: 2;
  width: 2;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const WrapperView = styled.View`
  align-self: ${({ align }: any) =>
    align === 'left' ? 'flex-start' : 'flex-end'};
  border-radius: 12;
  height: 24;
  margin-top: -17;
  overflow: hidden;
  padding-top: 12;
  width: 50;
`;

export default function TokenInfoItem({
  align = 'left',
  asset,
  color,
  children,
  enableHapticFeedback = true,
  isNft,
  onInfoPress,
  onPress,
  showDivider,
  showInfoButton,
  size,
  title,
  weight,
  lineHeight,
  loading: rawLoading,
  ...props
}: any) {
  const { colors } = useTheme();

  const loading = useDelayedValueWithLayoutAnimation(rawLoading);

  const hidden = useDelayedValueWithLayoutAnimation(!loading && !children);

  if (hidden) {
    return null;
  }

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      as={showDivider ? RowWithMargins : View}
      margin={showDivider ? 12 : 0}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithMargins
        flex={asset ? 1 : 0}
        justify={align === 'left' ? 'start' : 'end'}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        margin={android ? (isNft ? -3 : -6) : isNft ? 6 : 3}
        {...props}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonPressAnimation
          disabled={!showInfoButton}
          onPress={showInfoButton && onInfoPress}
          scaleTo={0.88}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TokenInfoHeading align={align} isNft={isNft}>
            {title}
            {showInfoButton ? (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <TokenInfoHeading
                color={colors.alpha(colors.whiteLabel, 0.25)}
                isNft
              >
                {' '}
                􀅵
              </TokenInfoHeading>
            ) : null}
          </TokenInfoHeading>
        </ButtonPressAnimation>
        {asset ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <TokenInfoBalanceValue align={align} asset={asset} isNft={isNft} />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ButtonPressAnimation
            enableHapticFeedback={onPress && enableHapticFeedback}
            onPress={onPress}
            scaleTo={1}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TokenInfoValue
              activeOpacity={0}
              align={align}
              color={color}
              isNft={isNft}
              lineHeight={lineHeight}
              size={size}
              weight={weight}
            >
              {!loading && children}
            </TokenInfoValue>
          </ButtonPressAnimation>
        )}
        {loading && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <WrapperView
            align={align}
            backgroundColor={colors.alpha(colors.blueGreyDark, 0.04)}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ShimmerAnimation
              color={colors.alpha(colors.blueGreyDark, 0.06)}
              enabled
              gradientColor={colors.alpha(colors.blueGreyDark, 0.06)}
              width={50}
            />
          </WrapperView>
        )}
      </ColumnWithMargins>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {showDivider && <VerticalDivider />}
    </Container>
  );
}
