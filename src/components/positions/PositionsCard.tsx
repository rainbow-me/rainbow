import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import React, { useMemo } from 'react';
import { useTheme } from '@/theme';

import { RainbowPosition } from '@/resources/defi/PositionsQuery';
import { GenericCard } from '../cards/GenericCard';
import startCase from 'lodash/startCase';
import { CoinIcon, RequestVendorLogoIcon } from '../coin-icon';
import { AssetType, EthereumAddress } from '@/entities';

type PositionCardProps = {
  position: RainbowPosition;
  onPress: (position: RainbowPosition) => void;
};

type CoinStackToken = {
  address: EthereumAddress;
  type: AssetType;
  symbol: string;
};

const positionColor = '#f5d0e5';

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
              borderColor: index > 0 ? positionColor : colors.transparent,
              borderWidth: 2,
            }}
          >
            <CoinIcon
              address={token.address}
              size={20}
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

  return (
    <Box width="full" height="126px">
      <GenericCard
        type={'stretch'}
        onPress={onPress}
        color={positionColor}
        borderColor={colors.alpha(colors.pink, 0.2)}
        padding={'16px'}
      >
        <Stack space="12px">
          <Box>
            <Columns space="20px" alignHorizontal="justify">
              <Column width="content">
                {/* @ts-ignore js component*/}
                <RequestVendorLogoIcon
                  backgroundColor={colors.pink}
                  dappName={startCase(position.type.split('-')[0])}
                  size={32}
                  borderRadius={10}
                  imageUrl={
                    'https://raw.githubusercontent.com/rainbow-me/assets/master/exchanges/hop.png'
                  }
                />
              </Column>
              <Column width="content">
                <CoinIconStack tokens={depositTokens} />
              </Column>
            </Columns>
          </Box>

          <Inline alignVertical="center" horizontalSpace={'4px'}>
            <Text color={{ custom: colors.pink }} size="15pt" weight="bold">
              {startCase(position.type.split('-')[0])}
            </Text>

            {totalPositions > 1 && (
              <Box
                borderRadius={9}
                padding={{ custom: 5.5 }}
                style={{
                  borderColor: colors.alpha(colors.pink, 0.05),
                  borderWidth: 2,
                  // offset vertical padding
                  marginVertical: -11,
                }}
              >
                <Text
                  color={{ custom: colors.pink }}
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
