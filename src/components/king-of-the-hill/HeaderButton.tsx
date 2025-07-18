import { ButtonPressAnimation } from '@/components/animations';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { Text, useBackgroundColor, useColorMode } from '@/design-system';
import React from 'react';
import { View, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';

interface HeaderButtonProps {
  onPress: () => void;
  children?: React.ReactNode;
  iconUrl?: string | null;
  text: string;
  style?: ViewStyle;
}

export const HeaderButton: React.FC<HeaderButtonProps> = ({ onPress, children, iconUrl, text, style }) => {
  const { isDarkMode } = useColorMode();
  const fillTertiaryColor = useBackgroundColor('fillTertiary');

  return (
    <ButtonPressAnimation onPress={onPress}>
      <GradientBorderView
        borderGradientColors={[fillTertiaryColor, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        borderRadius={20}
        backgroundColor={isDarkMode ? 'rgba(245, 248, 255, 0.12)' : 'rgba(9, 17, 31, 0.05)'}
        style={[{ height: 26 }, style]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            height: '100%',
          }}
        >
          {iconUrl && <FastImage source={{ uri: iconUrl }} style={{ width: 16, height: 16, borderRadius: 8, marginRight: 6 }} />}
          {children || (
            <Text color="labelSecondary" size="13pt" weight="bold">
              {text}
            </Text>
          )}
        </View>
      </GradientBorderView>
    </ButtonPressAnimation>
  );
};
