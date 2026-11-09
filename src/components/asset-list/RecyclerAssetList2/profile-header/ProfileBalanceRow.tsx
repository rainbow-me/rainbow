import React from 'react';

import { SkiaAnimatedNumber } from '@/components/animated-number/SkiaAnimatedNumber';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box, useBackgroundColor } from '@/design-system';
import { useLiveWalletBalance } from '@/hooks/useLiveWalletBalance';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const PROFILE_BALANCE_ROW_HEIGHT = 24;

const HORIZONTAL_INSET = 20;
const PLACEHOLDER_HEIGHT = PROFILE_BALANCE_ROW_HEIGHT;
const PLACEHOLDER_WIDTH = 200;

export const ProfileBalanceRow = React.memo(function ProfileBalanceRow() {
  const isLoading = useLiveWalletBalance(state => state === null);
  return isLoading ? (
    <Box height={PLACEHOLDER_HEIGHT} width={PLACEHOLDER_WIDTH}>
      <Skeleton>
        <FakeText height={PLACEHOLDER_HEIGHT} width={PLACEHOLDER_WIDTH} />
      </Skeleton>
    </Box>
  ) : (
    <AnimatedNumber />
  );
});

const AnimatedNumber = () => {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  const balance = useStoreSharedValue(useLiveWalletBalance, state => state ?? '');

  return (
    <Box alignItems="center" height={PROFILE_BALANCE_ROW_HEIGHT} paddingHorizontal="36px" width="full">
      <SkiaAnimatedNumber
        align="center"
        backgroundColor={backgroundColor}
        color="label"
        size="34pt"
        value={balance}
        weight="heavy"
        width={DEVICE_WIDTH - HORIZONTAL_INSET * 2}
      />
    </Box>
  );
};
