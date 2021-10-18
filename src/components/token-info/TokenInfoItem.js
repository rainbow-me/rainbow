import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation, ShimmerAnimation } from '../animations';
import { ColumnWithMargins, RowWithMargins } from '../layout';
import TokenInfoBalanceValue from './TokenInfoBalanceValue';
import TokenInfoHeading from './TokenInfoHeading';
import TokenInfoValue from './TokenInfoValue';
import { useTheme } from '@rainbow-me/context';
import { useDelayedValueWithLayoutAnimation } from '@rainbow-me/hooks';

const Container = styled.View``;

const VerticalDivider = styled.View`
  background-color: ${({ theme: { colors } }) => colors.rowDividerExtraLight};
  border-radius: 1;
  height: 40;
  margin-top: 2;
  width: 2;
`;

const WrapperView = styled.View`
  align-self: ${({ align }) => (align === 'left' ? 'flex-start' : 'flex-end')};
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
}) {
  const { colors } = useTheme();

  const loading = useDelayedValueWithLayoutAnimation(rawLoading);

  const hidden = useDelayedValueWithLayoutAnimation(!loading && !children);

  if (hidden) {
    return null;
  }

  return (
    <Container
      as={showDivider ? RowWithMargins : View}
      margin={showDivider ? 12 : 0}
    >
      <ColumnWithMargins
        flex={asset ? 1 : 0}
        justify={align === 'left' ? 'start' : 'end'}
        margin={android ? (isNft ? -3 : -6) : isNft ? 6 : 3}
        {...props}
      >
        <ButtonPressAnimation
          disabled={!showInfoButton}
          onPress={showInfoButton && onInfoPress}
          scaleTo={0.88}
        >
          <TokenInfoHeading align={align} isNft={isNft}>
            {title}
            {showInfoButton ? (
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
          <TokenInfoBalanceValue align={align} asset={asset} isNft={isNft} />
        ) : (
          <TokenInfoValue
            align={align}
            color={color}
            isNft={isNft}
            lineHeight={lineHeight}
            onPress={onPress}
            size={size}
            weight={weight}
          >
            {!loading && children}
          </TokenInfoValue>
        )}
        {loading && (
          <WrapperView
            align={align}
            backgroundColor={colors.alpha(colors.blueGreyDark, 0.04)}
          >
            <ShimmerAnimation
              color={colors.alpha(colors.blueGreyDark, 0.06)}
              enabled
              gradientColor={colors.alpha(colors.blueGreyDark, 0.06)}
              width={50}
            />
          </WrapperView>
        )}
      </ColumnWithMargins>
      {showDivider && <VerticalDivider />}
    </Container>
  );
}
