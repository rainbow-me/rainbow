import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import ReactCoinIcon from 'react-coin-icon';
import ShadowStack from 'react-native-shadow-stack';
import { borders, colors } from '../../styles';
import { magicMemo } from '../../utils';
import CoinIconFallback from './CoinIconFallback';
import CoinIconIndicator from './CoinIconIndicator';

export const CoinIconSize = 40;

const coinIconShadow = [
  [0, 4, 6, colors.dark, 0.04],
  [0, 1, 3, colors.dark, 0.08],
];

const CoinIcon = ({
  address,
  bgColor,
  isCoinListEdited,
  isHidden,
  isPinned,
  showShadow,
  size,
  symbol,
  ...props
}) =>
  showShadow ? (
    <Fragment>
      {(isPinned || isHidden) && isCoinListEdited ? (
        <CoinIconIndicator isPinned={isPinned} />
      ) : null}
      <ShadowStack
        {...props}
        {...borders.buildCircleAsObject(size)}
        backgroundColor={bgColor}
        opacity={isHidden ? 0.4 : 1}
        shadows={coinIconShadow}
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
  );

CoinIcon.propTypes = {
  address: PropTypes.oneOfType([PropTypes.oneOf([null]), PropTypes.string]),
  bgColor: PropTypes.string,
  isCoinListEdited: PropTypes.bool,
  isHidden: PropTypes.bool,
  isPinned: PropTypes.bool,
  showShadow: PropTypes.bool,
  size: PropTypes.number,
  symbol: PropTypes.oneOfType([PropTypes.oneOf([null]), PropTypes.string]),
};

CoinIcon.defaultProps = {
  showShadow: true,
  size: CoinIconSize,
};

export default magicMemo(CoinIcon, [
  'address',
  'bgColor',
  'isCoinListEdited',
  'isHidden',
  'isPinned',
  'symbol',
]);
