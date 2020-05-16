import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import ReactCoinIcon from 'react-coin-icon';
import ShadowStack from 'react-native-shadow-stack';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import { borders, colors } from '../../styles';
import { Icon } from '../icons';
import CoinIconFallback from './CoinIconFallback';

const CoinIconSize = 40;

const IndicatorIcon = styled.View`
  align-items: center;
  background-color: ${colors.blueGreyDark50};
  border-radius: 10;
  bottom: 3;
  height: 20;
  justify-content: center;
  left: 10;
  position: absolute;
  shadow-color: ${colors.blueGreyDark};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.4;
  shadow-radius: 6;
  width: 20;
  z-index: 10;
`;

const enhance = onlyUpdateForKeys([
  'bgColor',
  'symbol',
  'address',
  'isCoinListEdited',
  'isPinned',
  'isHidden',
]);
const CoinIcon = enhance(
  ({
    bgColor,
    showShadow,
    size,
    symbol,
    address,
    isPinned,
    isHidden,
    isCoinListEdited,
    ...props
  }) =>
    showShadow ? (
      <Fragment>
        {(isPinned || isHidden) && isCoinListEdited ? (
          <IndicatorIcon>
            <Icon
              color={colors.white}
              height={isPinned ? 13 : 10}
              marginTop={isPinned ? 1 : 0}
              name={isPinned ? 'pin' : 'hidden'}
              width={isPinned ? 8 : 14}
            />
          </IndicatorIcon>
        ) : null}
        <ShadowStack
          {...props}
          {...borders.buildCircleAsObject(size)}
          backgroundColor={bgColor}
          opacity={isHidden ? 0.4 : 1}
          shadows={[
            [0, 4, 6, colors.dark, 0.04],
            [0, 1, 3, colors.dark, 0.08],
          ]}
          shouldRasterizeIOS
        >
          <ReactCoinIcon
            address={address || ''}
            bgColor={bgColor}
            fallbackRenderer={CoinIconFallback}
            size={size}
            symbol={symbol || ''}
          />
        </ShadowStack>
      </Fragment>
    ) : (
      <ReactCoinIcon
        {...props}
        address={address || ''}
        bgColor={bgColor}
        fallbackRenderer={CoinIconFallback}
        size={size}
        symbol={symbol}
      />
    )
);

CoinIcon.propTypes = {
  address: PropTypes.oneOfType([PropTypes.oneOf([null]), PropTypes.string]),
  bgColor: PropTypes.string,
  showShadow: PropTypes.bool,
  size: PropTypes.number,
  symbol: PropTypes.oneOfType([PropTypes.oneOf([null]), PropTypes.string]),
};

CoinIcon.defaultProps = {
  showShadow: true,
  size: CoinIconSize,
};

CoinIcon.size = CoinIconSize;

export default CoinIcon;
