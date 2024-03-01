import React, { createElement } from 'react';
import { CoinIconSize } from '../coin-icon';
import { Column, Row } from '../layout';
import { useAccountSettings } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import RainbowCoinIcon from '../coin-icon/RainbowCoinIcon';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;
export const CoinRowHeight = CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom;

const Container = styled(Row).attrs({
  align: 'center',
  grow: 0,
  shrink: 1,
})({
  ...padding.object(CoinRowPaddingTop, 19, CoinRowPaddingBottom),
  width: '100%',
});

const Content = styled(Column).attrs({ justify: 'space-between' })({
  flex: 1,
  height: CoinIconSize,
  marginLeft: 10,
  opacity: ({ isHidden }) => (isHidden ? 0.4 : 1),
});

export default function CoinRow({
  address,
  badgeXPosition,
  badgeYPosition,
  bottomRowRender,
  children,
  coinIconRender = RainbowCoinIcon,
  containerStyles,
  contentStyles,
  isFirstCoinRow,
  isHidden,
  isPinned,
  isPool,
  name,
  symbol,
  testID,
  topRowRender,
  tokens,
  network,
  ...props
}) {
  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  return (
    <Container style={containerStyles}>
      {createElement(coinIconRender, {
        address,
        badgeXPosition,
        badgeYPosition,
        isFirstCoinRow,
        isHidden,
        isPinned,
        symbol,
        network,
        ...props,
      })}
      <Content isHidden={isHidden} justify="center" style={contentStyles}>
        <Row align="center" testID={`${testID}-${symbol || ''}-${network}`}>
          {topRowRender({
            name,
            nativeCurrency,
            nativeCurrencySymbol,
            symbol,
            ...props,
          })}
        </Row>
        <Row align="center" marginBottom={0.5} testID={testID}>
          {bottomRowRender({
            nativeCurrency,
            nativeCurrencySymbol,
            symbol,
            ...props,
          })}
        </Row>
      </Content>
      {typeof children === 'function' ? children({ symbol, ...props }) : children}
    </Container>
  );
}
