import React, { createElement } from 'react';
import styled from 'styled-components';
import { CoinIcon, CoinIconGroup, CoinIconSize } from '../coin-icon';
import { Column, Row } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const CoinRowPaddingTop = 9;
const CoinRowPaddingBottom = 10;
export const CoinRowHeight =
  CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom;

const Container = styled(Row).attrs({
  align: 'center',
  grow: 0,
  shrink: 1,
})`
  ${padding(CoinRowPaddingTop, 19, CoinRowPaddingBottom)};
  width: 100%;
`;

const Content = styled(Column).attrs({ justify: 'space-between' })`
  flex: 1;
  height: ${CoinIconSize};
  margin-left: 10;
  opacity: ${({ isHidden }) => (isHidden ? 0.4 : 1)};
`;

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
  ...props
}: any) {
  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container css={containerStyles}>
      {isPool ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          ...props,
        })
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content isHidden={isHidden} justify="center" style={contentStyles}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row align="center" testID={`${testID}-${symbol || ''}`}>
          {topRowRender({
            name,
            nativeCurrency,
            nativeCurrencySymbol,
            symbol,
            ...props,
          })}
        </Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
