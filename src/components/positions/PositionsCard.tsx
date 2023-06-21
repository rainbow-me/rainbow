import {
  Box,
  Column,
  Columns,
  Inline,
  Row,
  Rows,
  Stack,
  Text,
} from '@/design-system';
import React, { useMemo, useState } from 'react';
import { useTheme } from '@/theme';

import {
  Borrow,
  Claimable,
  Deposit,
  Position,
} from '@/resources/defi/PositionsQuery';
import { GenericCard } from '../cards/GenericCard';
import startCase from 'lodash/startCase';
import { CoinIcon, RequestVendorLogoIcon } from '../coin-icon';
import { Asset, AssetType, EthereumAddress, ZerionAsset } from '@/entities';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import {
  add,
  subtract,
  convertAmountToNativeDisplay,
  convertRawAmountToBalance,
  convertRawAmountToNativeDisplay,
  divide,
  greaterThan,
  lessThan,
  multiply,
  toFixedDecimals,
} from '@/helpers/utilities';

type PositionCardProps = {
  position: Position;
  onPress: (position: Position) => void;
};

type CoinStackToken = {
  address: EthereumAddress;
  type: AssetType;
  symbol: string;
};

type subPosition = {
  asset: ZerionAsset;
  display: { amount: string; display: string };
  type: 'deposit' | 'borrow' | 'claimable';
  position: Deposit | Borrow | Claimable;
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
  const [positionValueDisplay, setPositionValueDisplay] = useState<
    string | null
  >(null);
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

  const subPositions: subPosition[] = useMemo(() => {
    let subPositions: subPosition[] = [];
    let totalDeposits: string = '0';
    position.deposits.forEach((position: Deposit) => {
      let positionTokens: {
        asset: ZerionAsset;
        nativeDisplay: { amount: string; display: string };
        quantity: string;
      }[] = [];

      position.underlying.forEach(
        (underlying: { asset: ZerionAsset; quantity: string }) => {
          let asset = underlying.asset;
          let nativeDisplay = convertRawAmountToNativeDisplay(
            underlying.quantity,
            asset.decimals,
            asset.price?.value!,
            'USD'
          );
          console.log({ symbol: asset.symbol, nativeDisplay });
          totalDeposits = add(totalDeposits, nativeDisplay.amount);
          const newUnderlying = {
            asset,
            nativeDisplay,
            quantity: underlying.quantity,
          };
          positionTokens.push(newUnderlying);
        }
      );

      // const display = convertAmountAndPriceToNativeDisplay(asset.quantity, asset.price?.value!, 'USD')
      // console.log({...asset})
      // console.log({display})
      // const type = 'deposit'
      // subPositions.push({
      //   asset,
      //   type,
      //   position,
      //   display
      // });
    });

    let totalBorrows = '0';
    position?.borrows?.forEach((position: Borrow) => {
      let positionTokens: {
        asset: ZerionAsset;
        nativeDisplay: { amount: string; display: string };
        quantity: string;
      }[] = [];

      position.underlying.forEach(
        (underlying: { asset: ZerionAsset; quantity: string }) => {
          let asset = underlying.asset;
          let nativeDisplay = convertRawAmountToNativeDisplay(
            underlying.quantity,
            asset.decimals,
            asset.price?.value!,
            'USD'
          );
          console.log({ symbol: asset.symbol, nativeDisplay });
          totalBorrows = add(totalBorrows, nativeDisplay.amount);
          const newUnderlying = {
            asset,
            nativeDisplay,
            quantity: underlying.quantity,
          };
          positionTokens.push(newUnderlying);
        }
      );

      // const display = convertAmountAndPriceToNativeDisplay(asset.quantity, asset.price?.value!, 'USD')
      // console.log({...asset})
      // console.log({display})
      // const type = 'deposit'
      // subPositions.push({
      //   asset,
      //   type,
      //   position,
      //   display
      // });
    });

    console.log({ totalDeposits, totalBorrows });
    setPositionValueDisplay(
      convertAmountToNativeDisplay(subtract(totalDeposits, totalBorrows), 'USD')
    );
    return subPositions;
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
            {positionValueDisplay}
          </Text>
        </Stack>
      </GenericCard>
    </Box>
  );
};
