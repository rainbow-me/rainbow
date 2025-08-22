import React, { memo } from 'react';
import { Box, Text } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

type PerpsAvailableBalanceProps = {
  balance: string;
};

export const PerpsAvailableBalance = memo(function PerpsAvailableBalance({ balance }: PerpsAvailableBalanceProps) {
  return (
    <Box paddingHorizontal={'20px'}>
      <ButtonPressAnimation
        onPress={() => {
          Navigation.handleAction(Routes.PERPS_ACCOUNT_NAVIGATOR);
        }}
      >
        <Box
          justifyContent="center"
          borderColor={{ custom: 'blue' }}
          borderWidth={1}
          height={36}
          paddingHorizontal={'10px'}
          paddingVertical={'12px'}
          borderRadius={14}
        >
          <Box gap={4} flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text color="label" size="17pt" weight="medium">
              {'Available Balance'}
            </Text>
            <Text color="labelTertiary" size="17pt" weight="medium">
              {balance}
            </Text>
          </Box>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
});
