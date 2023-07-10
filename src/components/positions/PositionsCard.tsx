import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import React, { useCallback, useMemo } from 'react';
import { useTheme } from '@/theme';

import { RainbowPosition } from '@/resources/defi/PositionsQuery';
import { GenericCard } from '../cards/GenericCard';
import startCase from 'lodash/startCase';
import { CoinIcon, RequestVendorLogoIcon } from '../coin-icon';
import { AssetType, EthereumAddress } from '@/entities';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

type PositionCardProps = {
  position: RainbowPosition;
  onPress: (position: RainbowPosition) => void;
};

type CoinStackToken = {
  address: EthereumAddress;
  type: AssetType;
  symbol: string;
};

function CoinIconStack({
  tokens,
  positionColor,
}: {
  tokens: CoinStackToken[];
  positionColor: string;
}) {
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
              borderColor: index > 0 ? colors.transparent : colors.transparent,
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

export const PositionCard = ({ position, onPress }: PositionCardProps) => {
  const { colors } = useTheme();
  const totalPositions =
    (position.borrows?.length || 0) + (position.deposits?.length || 0);
  const { navigate } = useNavigation();
  const onPressHandler = useCallback(() => {
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
    <Box width="full" height="126px">
      <GenericCard
        type={'stretch'}
        onPress={onPressHandler}
        color={colors.alpha(positionColor, 0.04)}
        borderColor={colors.alpha(positionColor, 0.02)}
        padding={'16px'}
      >
        <Stack space="12px">
          <Box>
            <Columns space="20px" alignHorizontal="justify">
              <Column width="content">
                {/* @ts-ignore js component*/}
                <RequestVendorLogoIcon
                  backgroundColor={
                    position.type === 'compound'
                      ? colors.transparent
                      : positionColor
                  }
                  dappName={startCase(position.type.split('-')[0])}
                  size={32}
                  borderRadius={10}
                  imageUrl={position.dapp.icon_url}
                />
              </Column>
              <Column width="content">
                <CoinIconStack
                  tokens={depositTokens}
                  positionColor={positionColor}
                />
              </Column>
            </Columns>
          </Box>

          <Inline alignVertical="center" horizontalSpace={'4px'}>
            <Text color={{ custom: positionColor }} size="15pt" weight="bold">
              {startCase(position.type.split('-')[0])}
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
          <Text color={{ custom: colors.black }} size="17pt" weight="semibold">
            {position.totals.totals.display}
          </Text>
        </Stack>
      </GenericCard>
    </Box>
  );
};
