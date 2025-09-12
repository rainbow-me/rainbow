import { Box, Text, TextIcon } from '@/design-system';
import { TriggerOrderType } from '@/features/perps/types';
import React, { memo } from 'react';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { ButtonPressAnimation } from '@/components/animations';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';

type TriggerOrderCardProps = {
  type: TriggerOrderType;
  price: string;
  percentage: string;
  onPressDelete: () => void;
  isCancelling?: boolean;
};

export const TriggerOrderCard = memo(function TriggerOrderCard({
  type,
  price,
  percentage,
  onPressDelete,
  isCancelling,
}: TriggerOrderCardProps) {
  const { accentColors } = usePerpsAccentColorContext();
  const isTakeProfit = type === TriggerOrderType.TAKE_PROFIT;

  return (
    <Box
      width="full"
      borderWidth={2}
      backgroundColor={accentColors.surfacePrimary}
      borderColor={{ custom: accentColors.opacity8 }}
      borderRadius={28}
      padding={'20px'}
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box gap={12}>
          <Box flexDirection="row" alignItems="center" gap={5}>
            <TextIcon color={isTakeProfit ? 'green' : 'red'} size="11pt" weight="heavy">
              {isTakeProfit ? '􀑁' : '􁘳'}
            </TextIcon>
            <Text size="13pt" weight="bold" color={'labelSecondary'}>
              {isTakeProfit ? 'Take Profit' : 'Stop Loss'}
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Text size="17pt" weight="heavy" color={'label'}>
              {formatAssetPrice({ value: price, currency: 'USD' })}
            </Text>
            <Text size="17pt" weight="bold" color={'labelTertiary'}>
              {'Sell '}
              <Text size="17pt" weight="bold" color={'labelSecondary'}>
                {percentage}
              </Text>
            </Text>
          </Box>
        </Box>
      </Box>
      {isCancelling ? (
        <AnimatedSpinner color={accentColors.opacity100} isLoading={isCancelling} scaleInFrom={1} size={24} />
      ) : (
        <ButtonPressAnimation onPress={onPressDelete}>
          <TextIcon color={{ custom: accentColors.opacity100 }} size="17pt" weight="heavy">
            {'􀈒'}
          </TextIcon>
        </ButtonPressAnimation>
      )}
    </Box>
  );
});
