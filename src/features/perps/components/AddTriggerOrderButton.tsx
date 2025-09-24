import { ButtonPressAnimation } from '@/components/animations';
import { Box, TextShadow, Text } from '@/design-system';
import { TriggerOrderType, TriggerOrderSource } from '@/features/perps/types';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useCallback } from 'react';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import * as i18n from '@/languages';

type AddTriggerOrderButtonProps = {
  symbol: string;
  type: TriggerOrderType;
  disabled?: boolean;
  source?: TriggerOrderSource;
};

export const AddTriggerOrderButton = function AddTriggerOrderButton({
  symbol,
  type,
  disabled = false,
  source = TriggerOrderSource.EXISTING,
}: AddTriggerOrderButtonProps) {
  const { accentColors } = usePerpsAccentColorContext();

  const navigateToTriggerOrderSheet = useCallback(
    (triggerOrderType: TriggerOrderType) => {
      Navigation.handleAction(Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET, {
        triggerOrderType,
        symbol,
        source,
      });
    },
    [symbol, source]
  );

  return (
    <ButtonPressAnimation
      onPress={() => {
        navigateToTriggerOrderSheet(type);
      }}
      disabled={disabled}
    >
      <Box
        borderWidth={2}
        borderColor={{ custom: accentColors.opacity8 }}
        justifyContent="center"
        alignItems="center"
        padding={'20px'}
        borderRadius={28}
        backgroundColor={accentColors.opacity8}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <TextShadow blur={8} shadowOpacity={0.2}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {type === TriggerOrderType.STOP_LOSS
              ? i18n.t(i18n.l.perps.trigger_orders.add_stop_loss)
              : i18n.t(i18n.l.perps.trigger_orders.add_take_profit)}{' '}
            􀅼
          </Text>
        </TextShadow>
      </Box>
    </ButtonPressAnimation>
  );
};
