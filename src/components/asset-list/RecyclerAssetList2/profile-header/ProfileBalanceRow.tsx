import { Button } from '@/components/buttons';
import { showToast } from '@/components/rainbow-toast/useRainbowToasts';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box, Text } from '@/design-system';
import { TransactionStatus } from '@/entities';
import * as React from 'react';

export const ProfileBalanceRowHeight = 24;
const placeholderHeight = ProfileBalanceRowHeight;
const placeholderWidth = 200;

type ProfileBalanceRowProps = {
  totalValue: string;
  isLoadingBalance: boolean;
};

export function ProfileBalanceRow({ totalValue, isLoadingBalance }: ProfileBalanceRowProps) {
  return (
    <Box flexDirection="row">
      <Button
        onPress={() => {
          console.log('press');
          showToast({
            type: 'swap',
            status: TransactionStatus.swapping,
            fromChainId: 0,
            toChainId: 1,
            id: `${Math.random()}`,
          });
          console.log('pressdone');
        }}
        label="estes"
      >
        test
      </Button>

      <Button
        onPress={() => {
          console.log('press');
          showToast({
            type: 'swap',
            status: TransactionStatus.swapped,
            fromChainId: 0,
            toChainId: 1,
            id: `${Math.random()}`,
          });
          console.log('pressdone');
        }}
        label="estes"
      >
        test
      </Button>
    </Box>
  );
  return (
    <>
      {isLoadingBalance ? (
        <Box height={{ custom: placeholderHeight }} width={{ custom: placeholderWidth }}>
          <Skeleton>
            <FakeText height={placeholderHeight} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : (
        <Text testID="balance-text" numberOfLines={1} color="label" size={totalValue?.length > 14 ? '26pt' : '34pt'} weight="heavy">
          {totalValue}
        </Text>
      )}
    </>
  );
}
