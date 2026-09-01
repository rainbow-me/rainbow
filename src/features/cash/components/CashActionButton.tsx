import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import Spinner from '@/components/Spinner';
import { Box, Text, useForegroundColor, type TextProps } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';

type CashActionButtonProps = {
  color?: 'blue' | 'red';
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  shadow?: boolean;
  testID: string;
  textSize?: TextProps['size'];
  variant?: 'solid' | 'tinted' | 'plain';
};

export const CashActionButton = memo(function CashActionButton({
  color = 'blue',
  disabled = false,
  label,
  loading = false,
  onPress,
  shadow = false,
  testID,
  textSize = '22pt',
  variant = 'solid',
}: CashActionButtonProps) {
  const blue = useForegroundColor('blue');
  const spinnerColor = useForegroundColor(color);
  const isDisabled = disabled || loading;
  const textColor = variant === 'solid' ? 'white' : color;

  return (
    <ButtonPressAnimation
      disabled={isDisabled}
      onPress={onPress}
      scaleTo={0.96}
      style={styles.fullWidth}
      testID={testID}
      wrapperStyle={styles.fullWidth}
    >
      <Box
        alignItems="center"
        background={variant === 'solid' ? 'blue' : undefined}
        borderRadius={24}
        height={{ custom: 48 }}
        justifyContent="center"
        style={[
          variant === 'tinted' && { backgroundColor: opacity(blue, 0.12), borderColor: opacity(blue, 0.04), borderWidth: 1.66 },
          shadow && styles.shadow,
          shadow && { shadowColor: blue },
          isDisabled && styles.disabled,
        ]}
        width="full"
      >
        <Text align="center" color={textColor} size={textSize} weight="heavy">
          {label}
        </Text>

        {loading ? <Spinner color={variant === 'solid' ? 'white' : spinnerColor} size={24} style={styles.spinner} /> : null}
      </Box>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  shadow: {
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  spinner: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
});
