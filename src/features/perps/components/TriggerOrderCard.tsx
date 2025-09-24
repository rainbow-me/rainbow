import { Box, Text, TextIcon } from '@/design-system';
import { TriggerOrderType } from '@/features/perps/types';
import React, { memo } from 'react';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { ButtonPressAnimation } from '@/components/animations';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import * as i18n from '@/languages';

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
      padding="20px"
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box gap={12}>
          <Box flexDirection="row" alignItems="center" gap={5}>
            <TextIcon color={isTakeProfit ? 'green' : 'red'} height={8} size="icon 11px" weight="heavy" width={16}>
              {isTakeProfit ? '􀑁' : '􁘳'}
            </TextIcon>
            <Text size="13pt" weight="bold" color={'labelSecondary'}>
              {isTakeProfit ? i18n.t(i18n.l.perps.trigger_orders.take_profit) : i18n.t(i18n.l.perps.trigger_orders.stop_loss)}
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Text size="17pt" weight="heavy" color={'label'}>
              {formatAssetPrice({ value: price, currency: 'USD' })}
            </Text>
            <Text size="17pt" weight="bold" color={'labelTertiary'}>
              {`${i18n.t(i18n.l.perps.trigger_orders.sell)} `}
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
          <TextIcon color={{ custom: accentColors.opacity100 }} size="icon 17px" weight="heavy" width={22}>
            􀈒
          </TextIcon>
        </ButtonPressAnimation>
      )}
    </Box>
  );
});
