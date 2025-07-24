import { ButtonPressAnimation } from '@/components/animations';
import { CHEVRON_RIGHT_SYMBOL } from '@/components/king-of-the-hill/constants';
import { GradientBorderContent } from '@/components/king-of-the-hill/GradientBorderContent';
import { Text } from '@/design-system';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';

interface HeaderButtonProps {
  onPress: () => void;
  children?: React.ReactNode;
  iconUrl?: string | null;
}

export const HeaderButton: React.FC<HeaderButtonProps> = ({ onPress, children, iconUrl }) => {
  return (
    <ButtonPressAnimation onPress={onPress}>
      <GradientBorderContent height={26}>
        <View style={styles.buttonContent}>
          {iconUrl && <FastImage source={{ uri: iconUrl }} style={styles.buttonIcon} />}
          <View style={styles.buttonChildren}>{children}</View>
          <Text color="labelQuaternary" size="icon 9px" weight="heavy">
            {CHEVRON_RIGHT_SYMBOL}
          </Text>
        </View>
      </GradientBorderContent>
    </ButtonPressAnimation>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    gap: 6,
  },
  buttonChildren: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
