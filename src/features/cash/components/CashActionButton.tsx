import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import Spinner from '@/components/Spinner';
import { Box, Text, useForegroundColor, type TextProps } from '@/design-system';

type CashActionButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  shadow?: boolean;
  testID: string;
  textSize?: TextProps['size'];
};

export const CashActionButton = memo(function CashActionButton({
  disabled = false,
  label,
  loading = false,
  onPress,
  shadow = false,
  testID,
  textSize = '22pt',
}: CashActionButtonProps) {
  const blue = useForegroundColor('blue');
  const isDisabled = disabled || loading;

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
        background="blue"
        borderRadius={24}
        height={{ custom: 48 }}
        justifyContent="center"
        style={[shadow && styles.shadow, shadow && { shadowColor: blue }, isDisabled && styles.disabled]}
        width="full"
      >
        {loading ? (
          <Spinner color="white" size={24} />
        ) : (
          <Text align="center" color="white" size={textSize} weight="heavy">
            {label}
          </Text>
        )}
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
});
