import React from 'react';
import { StyleSheet } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { TextIcon } from '@/design-system';
import { type TextColor } from '@/design-system/color/palettes';
import { type TextWeight } from '@/design-system/components/Text/Text';
import { type TextSize } from '@/design-system/typography/typeHierarchy';

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
