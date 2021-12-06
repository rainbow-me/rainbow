import { isNil } from 'lodash';
import React, { useMemo } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import ReactCoinIcon from 'react-coin-icon';
import { View } from 'react-native';
import styled from 'styled-components';
import ContractInteraction from '../../assets/contractInteraction.png';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ChainBadge' was resolved to '/Users/nick... Remove this comment to see the full error message
import ChainBadge from './ChainBadge';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinIconFallback' was resolved to '/User... Remove this comment to see the full error message
import CoinIconFallback from './CoinIconFallback';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { getTokenMetadata, isETH, magicMemo } from '@rainbow-me/utils';

export const CoinIconSize = 40;

const ContractInteractionIcon = styled(ImgixImage)`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`;

const StyledCoinIcon = styled(ReactCoinIcon)`
  opacity: ${({ isHidden }) => (isHidden ? 0.4 : 1)};
`;

const CoinIcon = ({
  address = 'eth',
  badgeXPosition,
  badgeYPosition,
  badgeSize,
  forcedShadowColor,
  size = CoinIconSize,
  symbol = '',
  type,
  ...props
}: any) => {
  const tokenMetadata = getTokenMetadata(props.mainnet_address || address);
  const color = useColorForAsset({ address: props.mainnet_address || address });
  const { colors, isDarkMode } = useTheme();
  const forceFallback =
    !isETH(props.mainnet_address || address) && isNil(tokenMetadata);
  const isNotContractInteraction = useMemo(() => symbol !== 'contract', [
    symbol,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View>
      {isNotContractInteraction ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <StyledCoinIcon
          {...props}
          address={props.mainnet_address || address}
          color={color}
          fallbackRenderer={CoinIconFallback}
          forceFallback={forceFallback}
          // force update on change symbol due to ImageCache strategy
          key={symbol}
          shadowColor={
            forcedShadowColor ||
            (isDarkMode ? colors.shadow : tokenMetadata?.shadowColor || color)
          }
          size={size}
          symbol={symbol}
        />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ContractInteractionIcon size={size} source={ContractInteraction} />
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ChainBadge
        assetType={type}
        badgeXPosition={badgeXPosition}
        badgeYPosition={badgeYPosition}
        size={badgeSize}
      />
    </View>
  );
};

export default magicMemo(CoinIcon, [
  'address',
  'isHidden',
  'isPinned',
  'size',
  'type',
  'symbol',
  'shadowColor',
]);
