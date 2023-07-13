import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import React, { useCallback, useMemo } from 'react';
import { useTheme } from '@/theme';

import { GenericCard } from '../cards/GenericCard';
import startCase from 'lodash/startCase';
import { CoinIcon, RequestVendorLogoIcon } from '../coin-icon';
import { AssetType, EthereumAddress } from '@/entities';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';
import { IS_ANDROID } from '@/env';
import { capitalize } from 'lodash';
import { RainbowPosition } from '@/resources/defi/types';

type PositionCardProps = {
  position: RainbowPosition;
};

type CoinStackToken = {
  address: EthereumAddress;
  type: AssetType;
  symbol: string;
};

function CoinIconStack({ tokens }: { tokens: CoinStackToken[] }) {
  const { colors } = useTheme();

  return (
    <Box flexDirection="row" alignItems="center">
      {tokens.map((token, index) => {
        return (
          <Box
            key={`availableNetwork-${token.address}`}
            marginTop={{ custom: -2 }}
            marginLeft={{ custom: index > 0 ? -8 : 0 }}
            style={{
              position: 'relative',
              zIndex: tokens.length + index,
              borderRadius: 30,
              borderColor: colors.transparent,
              borderWidth: 2,
            }}
          >
            <CoinIcon
              address={token.address}
              size={16}
              symbol={token.symbol}
              type={token.type}
            />
          </Box>
        );
      })}
    </Box>
  );
}

export const PositionCard = ({ position }: PositionCardProps) => {
  const { colors, isDarkMode } = useTheme();
  const totalPositions =
    (position.borrows?.length || 0) +
    (position.deposits?.length || 0) +
    (position.claimables?.length || 0);
  const { navigate } = useNavigation();

  const onPressHandler = useCallback(() => {
    analyticsV2.track(event.positionsOpenedSheet, { dapp: position.type });
    navigate(Routes.POSITION_SHEET, { position });
  }, [navigate, position]);

  const depositTokens: CoinStackToken[] = useMemo(() => {
    let tokens: CoinStackToken[] = [];
    position.deposits.forEach((deposit: any) => {
      deposit.underlying.forEach((item: any) => {
        tokens.push({
          address: item.asset.asset_code,
          type: AssetType.token,
          symbol: item.asset.symbol,
        });
      });
    });

    return tokens;
  }, [position]);

  const positionColor =
    position.dapp.colors.primary || position.dapp.colors.fallback;

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
              <Inline
                alignVertical="center"
                horizontalSpace={'4px'}
                wrap={false}
              >
                <Text
                  color={{ custom: positionColor }}
                  size="15pt"
                  weight="bold"
                  numberOfLines={1}
                >
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
                    <Text
                      color={{ custom: positionColor }}
                      size="15pt"
                      weight="semibold"
                    >
                      {totalPositions}
                    </Text>
                  </Box>
                )}
              </Inline>
            </Box>
            <Text
              color={{ custom: colors.black }}
              size="17pt"
              weight="semibold"
              numberOfLines={1}
            >
              {position.totals.totals.display}
            </Text>
          </Stack>
        </Stack>
      </GenericCard>
    </Box>
  );
};
