import { Button } from '@/components/buttons';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { showToast } from '@/components/rainbow-toast/useRainbowToasts';
import { Box, Text } from '@/design-system';
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
    <>
      <Button
        onPress={() => {
          console.log('press');
          showToast({
            type: 'swap',
            fromToken: 'ETH',
            state: 'swapping',
            toToken: 'ZUMI',
            id: '',
          });
        }}
        label="estes"
      >
        test
      </Button>
    </>
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
