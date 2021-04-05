import React from 'react';
import styled from 'styled-components';
import { ShimmerAnimation } from '../animations';
import { ColumnWithMargins } from '../layout';
import TokenInfoBalanceValue from './TokenInfoBalanceValue';
import TokenInfoHeading from './TokenInfoHeading';
import TokenInfoValue from './TokenInfoValue';
import { useTheme } from '@rainbow-me/context';

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
  title,
  weight,
  lineHeight,
  loading,
  ...props
}) {
  const { colors } = useTheme();

  return (
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
          weight={weight}
        >
          {!loading && children}
        </TokenInfoValue>
      )}
      {loading && (
        <WrapperView backgroundColor={colors.alpha(colors.blueGreyDark, 0.03)}>
          <ShimmerAnimation
            color={colors.alpha(colors.blueGreyDark, 0.05)}
            enabled
            gradientColor={colors.alpha(colors.blueGreyDark, 0.05)}
            width={50}
          />
        </WrapperView>
      )}
    </ColumnWithMargins>
  );
}
