import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { ShimmerAnimation } from '../animations';
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
  showDivider,
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
        margin={android ? -6 : 3}
        {...props}
      >
        <TokenInfoHeading align={align}>{title}</TokenInfoHeading>
        {asset ? (
          <TokenInfoBalanceValue align={align} asset={asset} />
        ) : (
          <TokenInfoValue
            align={align}
            color={color}
            lineHeight={lineHeight}
            size={size}
            weight={weight}
          >
            {!loading && children}
          </TokenInfoValue>
        )}
        {loading && (
          <WrapperView
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
