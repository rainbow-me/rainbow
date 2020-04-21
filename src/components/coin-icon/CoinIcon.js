import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import ReactCoinIcon from 'react-coin-icon';
import { StyleSheet } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import { borders, colors, fonts, position, shadow } from '../../styles';
import { magicMemo } from '../../utils';
import { Icon } from '../icons';
import { Centered } from '../layout';
import CoinIconFallback from './CoinIconFallback';

export const CoinIconSize = 40;

const sx = StyleSheet.create({
  fallbackText: {
    fontFamily: fonts.family.SFProRounded,
    letterSpacing: fonts.letterSpacing.roundedTight,
    marginBottom: 1,
    textAlign: 'center',
  },
  indicatorIconContainer: {
    ...position.sizeAsObject(20),
    ...shadow.buildAsObject(0, 4, 6, colors.blueGreyDark, 0.4),
    backgroundColor: colors.blueGreyDark50,
    borderRadius: 10,
    bottom: 3,
    left: 10,
    position: 'absolute',
    zIndex: 10,
  },
});

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
        <Centered style={sx.indicatorIconContainer}>
          <Icon
            color={colors.white}
            height={isPinned ? 13 : 10}
            marginTop={isPinned ? 1 : 0}
            name={isPinned ? 'pin' : 'hidden'}
            width={isPinned ? 8 : 14}
          />
        </Centered>
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
