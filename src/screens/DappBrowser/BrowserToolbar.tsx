import { Bleed, Box, Columns, Inline, Text, useForegroundColor } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Share, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useBrowserContext } from './BrowserContext';
import { useTheme } from '@/theme';

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
          // width={{ custom: 24 }}
        >
          <Text align={textAlign || 'center'} color={disabled ? 'labelQuaternary' : color || 'blue'} size="17pt" weight="bold">
            {label}
          </Text>
        </Box>
      </Bleed>
    </TouchableOpacity>
  );
};

export const ToolbarIcon = ({
  color,
  disabled,
  icon,
  onPress,
  size,
  weight,
}: {
  color?: TextColor;
  disabled?: boolean;
  icon: string;
  onPress: () => void;
  size?: TextSize;
  weight?: TextWeight;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.4}
      disabled={disabled}
      hitSlop={{ bottom: 8, left: 0, right: 0, top: 8 }}
      onPress={onPress}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Box
        alignItems="center"
        height={{ custom: 20 }}
        justifyContent="center"
        // style={{ flexGrow: 1 }}
        // width={{ custom: 24 }}
      >
        <Text
          align="center"
          color={disabled ? 'labelQuaternary' : color || 'blue'}
          size={size || 'icon 20px'}
          weight={weight || 'semibold'}
        >
          {icon}
        </Text>
      </Box>
    </TouchableOpacity>
  );
};

export const BrowserToolbar = () => {
  const { activeTabIndex, closeTab, goBack, goForward, newTab, tabStates, tabViewProgress, tabViewVisible, toggleTabView } =
    useBrowserContext();
  const { goBack: closeBrowser } = useNavigation();
  const { canGoBack, canGoForward } = tabStates[activeTabIndex];

  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - (tabViewProgress?.value ?? 0),
    pointerEvents: tabViewVisible ? 'none' : 'auto',
  }));

  const tabViewBarStyle = useAnimatedStyle(() => ({
    opacity: tabViewProgress?.value ?? 0,
    pointerEvents: tabViewVisible ? 'auto' : 'none',
  }));

  const onShare = async () => {
    try {
      await Share.share({ message: tabStates[activeTabIndex].url });
    } catch (error) {
      console.error('Error sharing browser URL', error);
    }
  };

  return (
    <>
      <Box
        as={Animated.View}
        style={[
          {
            alignItems: 'center',
            // backgroundColor: '#191A1C',
            // borderBottomColor: separatorSecondary,
            // borderBottomWidth: 1,
            // borderTopColor: separatorSecondary,
            // borderTopWidth: 1,
            flexDirection: 'row',
            // height: 56,
            // justifyContent: 'space-between',
            // paddingHorizontal: 20,
            paddingBottom: 10,
            paddingTop: 6,
            width: deviceUtils.dimensions.width,
          },
          barStyle,
        ]}
      >
        <Columns alignHorizontal="justify" alignVertical="center" space="16px">
          <ToolbarIcon icon="􀆉" disabled={!canGoBack} onPress={goBack} />
          <ToolbarIcon icon="􀆊" disabled={!canGoForward} onPress={goForward} />
          {/* <ToolbarTextButton
              label="Close"
              onPress={closeBrowser}
              showBackground
            /> */}
          <ToolbarIcon icon="􀁰" onPress={closeBrowser} />
          <ToolbarIcon icon="􀈂" onPress={onShare} />
          <ToolbarIcon icon="􀐅" onPress={toggleTabView} />
        </Columns>
      </Box>
      <Box
        as={Animated.View}
        bottom={{ custom: safeAreaInsetValues.bottom }}
        position="absolute"
        style={[
          {
            alignItems: 'center',
            // backgroundColor: '#191A1C',
            // borderBottomColor: separatorSecondary,
            // borderBottomWidth: 1,
            // borderTopColor: separatorSecondary,
            // borderTopWidth: 1,
            flexDirection: 'row',
            // height: 56,
            // justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 10,
            paddingTop: 6,
            width: deviceUtils.dimensions.width,
          },
          tabViewBarStyle,
        ]}
      >
        <Columns alignHorizontal="justify" alignVertical="center">
          <Inline alignHorizontal="left">
            {/* <ToolbarIcon icon="􀐇" onPress={newTab} /> */}
            <ToolbarIcon icon="􀅼" onPress={newTab} />
          </Inline>
          <ToolbarIcon icon="􀺾" onPress={() => closeTab(tabStates.length - 1)} />
          <Inline alignHorizontal="right">
            <ToolbarTextButton label="Done" onPress={toggleTabView} textAlign="right" />
          </Inline>
        </Columns>
      </Box>
    </>
  );
};
