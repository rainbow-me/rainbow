import { memo } from 'react';
import { Box, Text, useColorMode } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import * as i18n from '@/languages';
import { View } from 'react-native';

type PerpsSheetActionButtonsProps = {
  cancelButtonText?: string;
  confirmButtonText?: string;
  confirmingButtonText?: string;
  isConfirmDisabled?: boolean;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const PerpsSheetActionButtons = memo(function PerpsSheetActionButtons({
  cancelButtonText = i18n.t(i18n.l.perps.common.cancel),
  confirmButtonText = i18n.t(i18n.l.perps.common.add),
  confirmingButtonText = i18n.t(i18n.l.perps.common.submitting),
  isConfirmDisabled,
  isConfirming,
  onCancel,
  onConfirm,
}: PerpsSheetActionButtonsProps) {
  const { isDarkMode } = useColorMode();

  return (
    <Box paddingHorizontal={{ custom: 18 }} flexDirection="row" alignItems="center" justifyContent="space-between" gap={12}>
      <View style={{ flex: 1 }}>
        <ButtonPressAnimation onPress={onCancel}>
          <Box
            height={48}
            borderRadius={24}
            backgroundColor={opacityWorklet('#F5F8FF', 0.06)}
            borderWidth={2}
            borderColor={'buttonStroke'}
            justifyContent="center"
            alignItems="center"
          >
            <Text size="20pt" weight="bold" color={'labelTertiary'}>
              {cancelButtonText}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </View>
      <View style={{ flex: 1 }}>
        <HyperliquidButton
          onPress={onConfirm}
          buttonProps={{ style: { opacity: isConfirmDisabled ? 0.5 : 1 }, disabled: isConfirmDisabled }}
        >
          <Text size="20pt" weight="black" color={isDarkMode ? 'black' : 'white'}>
            {isConfirming ? confirmingButtonText : confirmButtonText}
          </Text>
        </HyperliquidButton>
      </View>
    </Box>
  );
});
