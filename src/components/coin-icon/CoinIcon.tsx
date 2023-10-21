import React, { useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import ContractInteraction from '../../assets/contractInteraction.png';
import { useTheme } from '../../theme/ThemeContext';
import ChainBadge from './ChainBadge';
import { CoinIconFallback } from './CoinIconFallback';
import { Network } from '@/networks/types';
import { useColorForAsset } from '@/hooks';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import {
  ethereumUtils,
  isETH,
  magicMemo,
  CoinIcon as ReactCoinIcon,
} from '@/utils';
import { ChainBadgeType } from '@/components/coin-icon/ChainBadgeSizeConfigs';

export const CoinIconSize = 40;

const ContractInteractionIcon = styled(ImgixImage)(
  ({ size }: { size: number }) => ({
    height: size,
    width: size,
  })
);

const StyledCoinIcon = styled(ReactCoinIcon)({
  opacity: ({ isHidden }: { isHidden?: boolean }) => (isHidden ? 0.4 : 1),
});

type Props = {
  address?: string;
  badgeXPosition?: number;
  badgeYPosition?: number;
  badgeSize?: ChainBadgeType;
  ignoreBadge?: boolean;
  forcedShadowColor?: string;
  size?: number;
  symbol?: string;
  type?: string;
  mainnet_address?: string;
  shadowOpacity?: number;
} & Pick<ViewProps, 'testID' | 'style'>;

const CoinIcon: React.FC<Props> = ({
  address = 'eth',
  badgeXPosition,
  badgeYPosition,
  badgeSize,
  ignoreBadge = false,
  forcedShadowColor,
  size = CoinIconSize,
  symbol = '',
  type,
  mainnet_address,
  ...props
}) => {
  const color = useColorForAsset({
    address: mainnet_address || address,
  });
  const { colors, isDarkMode } = useTheme();
  const forceFallback = !isETH(mainnet_address || address);
  const isNotContractInteraction = useMemo(() => symbol !== 'contract', [
    symbol,
  ]);

  const theme = useTheme();

  const network = mainnet_address
    ? Network.mainnet
    : type
    ? ethereumUtils.getNetworkFromType(type)
    : Network.mainnet;

  return (
    <View>
      {isNotContractInteraction ? (
        <StyledCoinIcon
          {...props}
          address={mainnet_address || address}
          color={color}
          fallbackRenderer={CoinIconFallback}
          forceFallback={forceFallback}
          // force update on change symbol due to ImageCache strategy
          key={symbol}
          shadowColor={
            forcedShadowColor || (isDarkMode ? colors.shadow : color)
          }
          size={size}
          symbol={symbol}
          network={network}
          theme={theme}
        />
      ) : (
        <ContractInteractionIcon size={size} source={ContractInteraction} />
      )}
      {!ignoreBadge && (
        <ChainBadge
          assetType={type}
          badgeXPosition={badgeXPosition}
          badgeYPosition={badgeYPosition}
          size={badgeSize}
        />
      )}
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
