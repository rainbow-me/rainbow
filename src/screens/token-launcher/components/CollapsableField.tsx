import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Box, Text, useForegroundColor } from '@/design-system';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Layout } from 'react-native-reanimated';
import { FIELD_BACKGROUND_COLOR, FIELD_BORDER_COLOR, FIELD_BORDER_WIDTH } from '../constants';
import { ButtonPressAnimation } from '@/components/animations';

export const CollapsableField = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const borderColor = useForegroundColor('buttonStroke');

  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      return !prev;
    });
  };

  return (
    <Animated.View style={[styles.container, { borderColor }]}>
      <View style={[styles.header, { paddingBottom: collapsed ? 0 : 10 }]}>
        <Text color="label" size="17pt" weight="heavy">
          {title}
        </Text>
        <ButtonPressAnimation onPress={toggleCollapsed}>
          <Box
            backgroundColor="rgba(255,255,255,0.06)"
            borderRadius={16}
            width={32}
            height={32}
            justifyContent="center"
            alignItems="center"
          >
            <Text color="label" size="17pt" weight="heavy">
              {collapsed ? '􀅼' : '􀅽'}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </View>

      {!collapsed && children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: FIELD_BORDER_WIDTH,
    backgroundColor: FIELD_BACKGROUND_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    fontSize: 14,
    color: 'blue',
  },
  contentContainer: {
    overflow: 'hidden',
  },
  content: {
    padding: 10,
  },
});
