import React from 'react';
import styled from 'styled-components';
import { ShimmerAnimation } from '../animations';
import { ColumnWithMargins } from '../layout';
import TokenInfoBalanceValue from './TokenInfoBalanceValue';
import TokenInfoHeading from './TokenInfoHeading';
import TokenInfoValue from './TokenInfoValue';
import { useTheme } from '@rainbow-me/context';

const WrapperView = styled.View`
  width: 100;
  padding-top: 5;
  position: absolute;
  height: 30;
  border-radius: 15;
  overflow: hidden;
  top: 18;
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
      overflow="hidden"
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
        <WrapperView>
          <ShimmerAnimation
            color={colors.whiteLabel}
            enabled
            gradientColor={colors.mediumGrey}
            width={20}
          />
        </WrapperView>
      )}
    </ColumnWithMargins>
  );
}
