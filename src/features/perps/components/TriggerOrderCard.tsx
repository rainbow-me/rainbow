import { Box, Text, TextIcon } from '@/design-system';
import { TriggerOrderType } from '@/features/perps/types';
import React, { memo } from 'react';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { ButtonPressAnimation } from '@/components/animations';

type TriggerOrderCardProps = {
  type: TriggerOrderType;
  price: string;
  percentage: string;
  onPressDelete: () => void;
};

export const TriggerOrderCard = memo(function TriggerOrderCard({ type, price, percentage, onPressDelete }: TriggerOrderCardProps) {
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
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box gap={12}>
          <Box flexDirection="row" alignItems="center" gap={5}>
            <TextIcon color={isTakeProfit ? 'green' : 'red'} size="11pt" weight="heavy">
              {isTakeProfit ? '􀑁' : '􁘳'}
            </TextIcon>
            <Text size="13pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
              {isTakeProfit ? 'Take Profit' : 'Stop Loss'}
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Text size="17pt" weight="heavy" color={'label'}>
              {price}
            </Text>
            <Text size="13pt" weight="bold" color={'labelTertiary'}>
              {'Sell '}
              <Text size="13pt" weight="bold" color={'labelSecondary'}>
                {percentage}
              </Text>
            </Text>
          </Box>
        </Box>
      </Box>
      <ButtonPressAnimation onPress={onPressDelete}>
        <TextIcon color={{ custom: accentColors.opacity100 }} size="17pt" weight="heavy">
          {'􀄨'}
        </TextIcon>
      </ButtonPressAnimation>
    </Box>
  );
});
