import { Box, Column, Columns, Inline, Stack, Text, globalColors } from '@/design-system';
import React, { memo, useCallback, useMemo } from 'react';
import { useTheme } from '@/theme';

import { GenericCard } from '../cards/GenericCard';
import startCase from 'lodash/startCase';
import { RequestVendorLogoIcon } from '../coin-icon';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { IS_ANDROID } from '@/env';
import { capitalize, uniqBy } from 'lodash';
import { PositionAsset, RainbowBorrow, RainbowClaimable, RainbowDeposit, RainbowPosition, RainbowStake } from '@/resources/defi/types';
import RainbowCoinIcon from '../coin-icon/RainbowCoinIcon';

type PositionCardProps = {
  position: RainbowPosition;
};

const CoinIconForStack = memo(function CoinIconForStack({ token }: { token: PositionAsset }) {
  return (
    <RainbowCoinIcon
      size={16}
      icon={token.icon_url}
      chainId={token.chain_id}
      symbol={token.symbol}
      color={token.colors?.primary ?? token.colors?.fallback ?? undefined}
      showBadge={false}
    />
  );
});

const CoinIconStack = memo(function CoinIconStack({ tokens }: { tokens: PositionAsset[] }) {
  return (
    <Box flexDirection="row" alignItems="center">
      {tokens.map((token, index) => {
        return (
          <Box
            key={`availableNetwork-${token.asset_code}`}
            marginTop={{ custom: -2 }}
            marginLeft={{ custom: index > 0 ? -8 : 0 }}
            style={{
              position: 'relative',
              zIndex: tokens.length + index,
              borderRadius: 30,
              borderColor: 'transparent',
              borderWidth: 2,
            }}
          >
            <CoinIconForStack token={token} />
          </Box>
        );
      })}
    </Box>
  );
});

export const PositionCard = ({ position }: PositionCardProps) => {
  const { colors, isDarkMode } = useTheme();
  const totalPositions =
    (position.borrows.length || 0) + (position.deposits.length || 0) + (position.claimables.length || 0) + (position.stakes.length || 0);

  const onPressHandler = useCallback(() => {
    analytics.track(analytics.event.positionsOpenedSheet, { dapp: position.type });
    Navigation.handleAction(Routes.POSITION_SHEET, { position });
  }, [position]);

  const depositTokens: PositionAsset[] = useMemo(() => {
    const tokens: PositionAsset[] = [];
    position.deposits.forEach((deposit: RainbowDeposit) => {
      deposit.underlying.forEach(({ asset }) => {
        tokens.push(asset);
      });
    });
    position.stakes.forEach((stake: RainbowStake) => {
      stake.underlying.forEach(({ asset }) => {
        tokens.push(asset);
      });
    });
    position.claimables.forEach((claimable: RainbowClaimable) => {
      tokens.push(claimable.asset);
    });
    position.borrows.forEach((borrow: RainbowBorrow) => {
      borrow.underlying.forEach(({ asset }) => {
        tokens.push(asset);
      });
    });

    // TODO: if more than 5 unique tokens but duplicates of a token across networks, use different asset
    const dedupedTokens = uniqBy(tokens, 'symbol');
    return dedupedTokens?.slice(0, 5);
  }, [position]);

  const positionColor =
    position.dapp.colors.primary || position.dapp.colors.fallback || (isDarkMode ? globalColors.white100 : globalColors.white10);

  return (
    <Box width="full" height={{ custom: 117 }}>
      <GenericCard
        type={'stretch'}
        onPress={onPressHandler}
        color={colors.alpha(positionColor, 0.04)}
        borderColor={colors.alpha(positionColor, 0.02)}
        ignoreShadow={IS_ANDROID && isDarkMode}
        padding={'16px'}
      >
        <Stack space="16px">
          <Box>
            <Columns space="20px" alignHorizontal="justify">
              <Column width="content">
                {/* @ts-ignore js component*/}
                <RequestVendorLogoIcon
                  backgroundColor={positionColor}
                  dappName={startCase(position.type.split('-')[0])}
                  size={32}
                  borderRadius={10}
                  imageUrl={position.dapp.icon_url}
                  noShadow={IS_ANDROID}
                />
              </Column>
              <Column width="content">
                <CoinIconStack tokens={depositTokens} />
              </Column>
            </Columns>
          </Box>
          <Stack space="12px">
            <Box style={{ width: '90%' }}>
              <Inline alignVertical="center" horizontalSpace={'4px'} wrap={false}>
                <Text color={{ custom: positionColor }} size="15pt" weight="bold" numberOfLines={1}>
                  {capitalize(position.dapp.name.replaceAll('-', ' '))}
                </Text>

                {totalPositions > 1 && (
                  <Box
                    borderRadius={9}
                    padding={{ custom: 5.5 }}
                    style={{
                      borderColor: colors.alpha(positionColor, 0.05),
                      borderWidth: 2,
                      // offset vertical padding
                      marginVertical: -11,
                    }}
                  >
                    <Text color={{ custom: positionColor }} size="15pt" weight="semibold">
                      {totalPositions}
                    </Text>
                  </Box>
                )}
              </Inline>
            </Box>
            <Text color={{ custom: colors.black }} size="17pt" weight="semibold" numberOfLines={1}>
              {position.totals.totals.display}
            </Text>
          </Stack>
        </Stack>
      </GenericCard>
    </Box>
  );
};
