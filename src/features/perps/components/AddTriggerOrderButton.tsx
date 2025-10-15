import { ButtonPressAnimation } from '@/components/animations';
import { Box, TextShadow, Text, useColorMode, TextIcon } from '@/design-system';
import { TriggerOrderType, TriggerOrderSource } from '@/features/perps/types';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useCallback } from 'react';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

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
  const { isDarkMode } = useColorMode();
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
      scaleTo={0.95}
    >
      <Box
        borderWidth={isDarkMode ? 2 : THICK_BORDER_WIDTH}
        borderColor={{ custom: isDarkMode ? accentColors.opacity8 : accentColors.opacity5 }}
        justifyContent="space-between"
        alignItems="center"
        padding={'20px'}
        borderRadius={28}
        backgroundColor={isDarkMode ? accentColors.opacity8 : accentColors.opacity10}
        style={{ opacity: disabled ? 0.4 : 1 }}
        flexDirection="row"
      >
        <TextShadow blur={8} shadowOpacity={0.2}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {type === TriggerOrderType.STOP_LOSS ? i18n.perps.trigger_orders.add_stop_loss() : i18n.perps.trigger_orders.add_take_profit()}
          </Text>
        </TextShadow>
        <TextIcon color={{ custom: accentColors.opacity100 }} size="icon 20px" weight="heavy" width={24}>
          {'􀅼'}
        </TextIcon>
      </Box>
    </ButtonPressAnimation>
  );
};
