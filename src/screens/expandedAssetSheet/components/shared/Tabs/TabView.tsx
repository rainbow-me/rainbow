import React, { memo, useContext } from 'react';
import { TabContext } from './TabContext';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { StyleSheet } from 'react-native';

const TabViewChild = ({ child, index }: { child: React.ReactNode; index: number }) => {
  const { activeTabIndex } = useContext(TabContext);

  const activeChildStyle = useAnimatedStyle(() => {
    const activeValue = typeof activeTabIndex === 'number' ? activeTabIndex : activeTabIndex.value;
    const isActive = activeValue === index;
    return {
      opacity: withTiming(isActive ? 1 : 0, TIMING_CONFIGS.fastFadeConfig),
      pointerEvents: isActive ? 'auto' : 'none',
      zIndex: isActive ? 1 : 0,
    };
  });

  return <Animated.View style={[activeChildStyle, sx.container]}>{child}</Animated.View>;
};

export const TabView = memo(function TabView({ children }: { children: React.ReactNode[] }) {
  return children.map((child, index) => {
    return <TabViewChild key={index} child={child} index={index} />;
  });
});

const sx = StyleSheet.create({
  container: {
    flex: 1,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
    overflow: 'hidden',
  },
});
