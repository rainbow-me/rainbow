import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import { TriggerOrderType } from '@/features/perps/types';
import React, { memo } from 'react';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { ButtonPressAnimation } from '@/components/animations';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

type TriggerOrderCardProps = {
  type: TriggerOrderType;
  price: string;
  percentage: string;
  projectedPnl: string;
  onPressDelete: () => void;
  isCancelling?: boolean;
};

export const TriggerOrderCard = memo(function TriggerOrderCard({
  type,
  price,
  percentage,
  projectedPnl,
  onPressDelete,
  isCancelling,
}: TriggerOrderCardProps) {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const isTakeProfit = type === TriggerOrderType.TAKE_PROFIT;
  const projectedLabel = isTakeProfit ? i18n.t(i18n.l.perps.trigger_orders.gain) : i18n.t(i18n.l.perps.trigger_orders.loss);

  return (
    <Box
      width="full"
      borderWidth={isDarkMode ? 2 : THICK_BORDER_WIDTH}
      backgroundColor={isDarkMode ? accentColors.surfacePrimary : opacityWorklet('#09111F', 0.02)}
      borderColor={{ custom: isDarkMode ? accentColors.opacity8 : opacityWorklet('#09111F', 0.02) }}
      borderRadius={28}
      padding="20px"
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
          <Box flexDirection="row" alignItems="center" gap={5}>
            <Text size="13pt" weight="bold" color={'labelTertiary'}>
              {projectedLabel}
            </Text>
            <Text size="13pt" weight="bold" color={isTakeProfit ? 'green' : 'red'}>
              {projectedPnl}
            </Text>
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
    </Box>
  );
});
