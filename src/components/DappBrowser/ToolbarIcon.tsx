import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, Text, TextIcon, useForegroundColor } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { useTheme } from '@/theme';

export const ToolbarIcon = ({
  color,
  disabled,
  icon,
  onPress,
  scaleTo,
  side,
  size = 'icon 17px',
  weight = 'bold',
}: {
  color?: TextColor;
  disabled?: boolean;
  icon: string;
  onPress: () => void;
  scaleTo?: number;
  side?: 'left' | 'right';
  size?: TextSize;
  weight?: TextWeight;
}) => {
  return (
    <ButtonPressAnimation disabled={disabled} onPress={onPress} scaleTo={scaleTo} style={styles.buttonPressWrapper}>
      <TextIcon
        color={disabled ? 'labelQuaternary' : color || 'blue'}
        containerSize={20}
        size={size}
        // eslint-disable-next-line no-nested-ternary
        textStyle={!side ? {} : side === 'left' ? styles.leftSidePadding : styles.rightSidePadding}
        weight={weight}
      >
        {icon}
      </TextIcon>
    </ButtonPressAnimation>
  );
};

export const ToolbarTextButton = ({
  color,
  disabled,
  label,
  onPress,
  showBackground,
  textAlign,
}: {
  color?: TextColor;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  showBackground?: boolean;
  textAlign?: 'center' | 'left' | 'right';
}) => {
  const { colors } = useTheme();
  const hexColor = useForegroundColor(color || 'blue');

  return (
    <TouchableOpacity
      activeOpacity={0.4}
      disabled={disabled}
      hitSlop={{ bottom: 8, left: 0, right: 0, top: 8 }}
      onPress={onPress}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Bleed vertical={showBackground ? '4px' : undefined}>
        <Box
          alignItems="center"
          borderRadius={showBackground ? 14 : undefined}
          height={{ custom: showBackground ? 28 : 20 }}
          justifyContent="center"
          paddingHorizontal={showBackground ? '8px' : undefined}
          style={{
            backgroundColor: showBackground ? colors.alpha(hexColor, 0.1) : undefined,
            flex: 1,
          }}
        >
          <Text align={textAlign || 'center'} color={disabled ? 'labelQuaternary' : color || 'blue'} size="17pt" weight="bold">
            {label}
          </Text>
        </Box>
      </Bleed>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonPressWrapper: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 40,
  },
  leftSidePadding: {
    paddingLeft: 4,
  },
  rightSidePadding: {
    paddingRight: 4,
  },
});
