import React, { createElement } from 'react';
import { CoinIcon, CoinIconGroup, CoinIconSize } from '../coin-icon';
import { Column, Row } from '../layout';
import { useAccountSettings } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;
export const CoinRowHeight =
  CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom;

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
  coinIconRender = CoinIcon,
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
  type,
  ...props
}) {
  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  return (
    <Container style={containerStyles}>
      {isPool ? (
        <CoinIconGroup tokens={tokens} />
      ) : (
        createElement(coinIconRender, {
          address,
          badgeXPosition,
          badgeYPosition,
          isFirstCoinRow,
          isHidden,
          isPinned,
          symbol,
          type,
          ...props,
        })
      )}
      <Content isHidden={isHidden} justify="center" style={contentStyles}>
        <Row align="center" testID={`${testID}-${symbol || ''}`}>
          {topRowRender({
            name,
            nativeCurrency,
            nativeCurrencySymbol,
            symbol,
            ...props,
          })}
        </Row>
        <Row align="center" marginBottom={0.5}>
          {bottomRowRender({
            nativeCurrency,
            nativeCurrencySymbol,
            symbol,
            ...props,
          })}
        </Row>
      </Content>
      {typeof children === 'function'
        ? children({ symbol, ...props })
        : children}
    </Container>
  );
}
