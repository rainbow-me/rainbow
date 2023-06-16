import { Box, Column, Columns, Stack, Text } from '@/design-system';
import React, { useMemo } from 'react';
import { useTheme } from '@/theme';

import { Position } from '@/resources/defi/PositionsQuery';
import { GenericCard } from '../cards/GenericCard';
import startCase from 'lodash/startCase';
import { CoinIcon, RequestVendorLogoIcon } from '../coin-icon';
import { AssetType, EthereumAddress } from '@/entities';

type PositionCardProps = {
  position: Position;
  onPress: (position: Position) => void;
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

  // seen in rewards, do we have support for all of these?
  // TODO: For now we are disabling using the asset price in native currency

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
    <Box width="full">
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
          <Text color={{ custom: colors.pink }} size="15pt" weight="bold">
            {startCase(position.type.split('-')[0])}
          </Text>
          <Text color={{ custom: colors.black }} size="17pt" weight="semibold">
            {'$6969.42'}
          </Text>
        </Stack>
      </GenericCard>
    </Box>
  );
};
