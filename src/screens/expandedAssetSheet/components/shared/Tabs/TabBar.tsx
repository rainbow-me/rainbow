import React, { useContext } from 'react';
import { TabContext } from './TabContext';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { colors } from '@/styles';
import { AnimatedText, useForegroundColor } from '@/design-system';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

export const TabPill = ({ tab, index }: { tab: string; index: number }) => {
  const { activeTabIndex, accentColor } = useContext(TabContext);
  const labelSecondary = useForegroundColor('labelSecondary');

  const activeTabStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(
        activeTabIndex.value === index ? opacityWorklet(accentColor, 0.06) : colors.transparent,
        TIMING_CONFIGS.tabPressConfig
      ),
      backgroundColor: withTiming(
        activeTabIndex.value === index ? opacityWorklet(accentColor, 0.12) : colors.transparent,
        TIMING_CONFIGS.tabPressConfig
      ),
    };
  });

  const activeTabTextStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(activeTabIndex.value === index ? accentColor : labelSecondary, TIMING_CONFIGS.tabPressConfig),
    };
  });

  return (
    <GestureHandlerButton
      key={tab}
      style={[styles.tab, activeTabStyle]}
      onPressWorklet={() => {
        'worklet';
        activeTabIndex.value = index;
      }}
    >
      <AnimatedText style={activeTabTextStyle} size="17pt / 135%" numberOfLines={1} align="center" weight="heavy">
        {tab}
      </AnimatedText>
    </GestureHandlerButton>
  );
};

export const TabBar = () => {
  const { tabs, accentColor } = useContext(TabContext);
  const separatorTertiary = useForegroundColor('separatorTertiary');
  return (
    <View style={[styles.container, { borderColor: opacity(accentColor, 0.1) }]}>
      {tabs.map((tab, index) => {
        if (index < tabs.length - 1) {
          return (
            <React.Fragment key={tab}>
              <TabPill tab={tab} index={index} />
              <View style={[styles.divider, { backgroundColor: separatorTertiary }]} />
            </React.Fragment>
          );
        }
        return <TabPill tab={tab} key={tab} index={index} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    display: 'flex',
    alignItems: 'center',
    padding: 3 - THICK_BORDER_WIDTH,
    gap: 3,
    borderRadius: 22,
    borderWidth: THICK_BORDER_WIDTH,
    height: 36,
  },
  divider: {
    width: 1,
    height: 20,
    borderRadius: 1,
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    borderRadius: 17,
    height: 30,
  },
});
