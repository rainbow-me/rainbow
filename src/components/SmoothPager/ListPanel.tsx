import React, { useCallback, useMemo } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import {
  AnimatedText,
  Box,
  Column,
  Columns,
  Separator,
  Stack,
  Text,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { IS_ANDROID, IS_IOS } from '@/env';
import { returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { colors } from '@/styles';
import { deviceUtils } from '@/utils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import { TOP_INSET } from '../DappBrowser/Dimensions';
import { useNavigation } from '@/navigation';
import { fontWithWidthWorklet } from '@/styles/buildTextStyles';
import { useAccountAccentColor } from '@/hooks';

export const TapToDismiss = React.memo(function TapToDismiss() {
  const { goBack } = useNavigation();
  return (
    <TouchableWithoutFeedback onPress={goBack}>
      <View style={controlPanelStyles.cover} />
    </TouchableWithoutFeedback>
  );
});

const LIST_SCROLL_INDICATOR_BOTTOM_INSET = { bottom: 42 };

export const ListPanel = ({
  TitleComponent,
  animatedAccentColor,
  goBack,
  items,
  onSelect,
  pageTitle,
  renderLabelComponent,
  scrollViewProps,
  selectedItemId,
  showBackButton,
}: {
  TitleComponent?: React.ReactNode;
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  items?: ControlPanelMenuItemProps[];
  onSelect: (selectedItemId: string) => void;
  pageTitle: string;
  renderLabelComponent?: (label: string) => React.ReactNode;
  scrollViewProps?: ScrollViewProps;
  selectedItemId: SharedValue<string>;
  showBackButton?: boolean;
}) => {
  const memoizedItems = useMemo(() => items, [items]);

  return (
    <Panel>
      <Box style={controlPanelStyles.listPanel}>
        <ListHeader TitleComponent={TitleComponent} goBack={goBack} showBackButton={showBackButton} title={pageTitle} />
        <ScrollView
          contentContainerStyle={controlPanelStyles.listScrollViewContentContainer}
          scrollIndicatorInsets={LIST_SCROLL_INDICATOR_BOTTOM_INSET}
          style={controlPanelStyles.listScrollView}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...scrollViewProps}
        >
          <Box width="full">
            {memoizedItems?.map(item => (
              <ControlPanelMenuItem
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...item}
                animatedAccentColor={animatedAccentColor}
                key={item.uniqueId}
                onPress={() => onSelect(item.uniqueId)}
                renderLabelComponent={renderLabelComponent}
                selectedItemId={selectedItemId}
              />
            ))}
          </Box>
        </ScrollView>
      </Box>
    </Panel>
  );
};

export const ListHeader = React.memo(function ListHeader({
  TitleComponent,
  goBack,
  rightComponent,
  showBackButton,
  title,
}: {
  TitleComponent?: React.ReactNode;
  goBack?: () => void;
  rightComponent?: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
}) {
  const { highContrastAccentColor } = useAccountAccentColor();

  const backIconStyle = useAnimatedStyle(() => {
    return {
      color: highContrastAccentColor,
      ...fontWithWidthWorklet('700'),
    };
  });

  return (
    <Box style={controlPanelStyles.listHeader}>
      <Box style={controlPanelStyles.listHeaderContent}>
        {showBackButton && (
          <ButtonPressAnimation onPress={goBack} scaleTo={0.8} style={controlPanelStyles.listHeaderButtonWrapper}>
            <Box alignItems="center" height={{ custom: 20 }} justifyContent="center" width={{ custom: 20 }}>
              <AnimatedText align="center" size="icon 20px" style={backIconStyle} weight="bold">
                􀆉
              </AnimatedText>
            </Box>
          </ButtonPressAnimation>
        )}
        <Box alignItems="center" justifyContent="center" paddingHorizontal="44px" width="full">
          {TitleComponent || (
            <Text align="center" color="label" size="20pt" weight="heavy">
              {title}
            </Text>
          )}
        </Box>
        <Box style={[controlPanelStyles.listHeaderButtonWrapper, controlPanelStyles.listHeaderRightComponent]}>{rightComponent}</Box>
      </Box>
      <Box width="full">
        <Separator color="separatorTertiary" thickness={1} />
      </Box>
    </Box>
  );
});

export interface ControlPanelMenuItemProps {
  IconComponent: React.ReactNode;
  animatedAccentColor?: SharedValue<string | undefined>;
  label: string;
  labelColor?: TextColor;
  imageUrl?: string;
  color?: string;
  onPress?: () => void;
  renderLabelComponent?: (label: string) => React.ReactNode;
  secondaryLabel?: string;
  secondaryLabelColor?: TextColor;
  selected?: boolean;
  selectedItemId?: SharedValue<string>;
  uniqueId: string;
}

export const ControlPanelMenuItem = React.memo(function ControlPanelMenuItem({
  IconComponent,
  animatedAccentColor,
  label,
  onPress,
  renderLabelComponent,
  secondaryLabel,
  secondaryLabelColor,
  selectedItemId,
  uniqueId,
}: ControlPanelMenuItemProps) {
  const { isDarkMode } = useColorMode();
  const labelTextColor = useForegroundColor('label');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const borderColor = isDarkMode ? opacity(separatorSecondary, 0.02) : opacity(separatorSecondary, 0.015);

  const handlePress = useCallback(() => {
    if (selectedItemId) {
      selectedItemId.value = uniqueId;
    }

    onPress?.();
  }, [onPress, selectedItemId, uniqueId]);

  const selectedStyle = useAnimatedStyle(() => {
    const selected = selectedItemId?.value === uniqueId;
    return {
      // eslint-disable-next-line no-nested-ternary
      backgroundColor: selected ? (isDarkMode ? globalColors.white10 : '#FBFCFD') : 'transparent',
      borderColor: selected ? borderColor : 'transparent',
      borderWidth: !selected || IS_ANDROID ? 0 : THICK_BORDER_WIDTH,
      paddingLeft: !selected || IS_ANDROID ? 10 : 10 - THICK_BORDER_WIDTH,
      paddingRight: !selected || IS_ANDROID ? 14 : 14 - THICK_BORDER_WIDTH,
      paddingVertical: !selected || IS_ANDROID ? 10 : 10 - THICK_BORDER_WIDTH,
    };
  });

  const selectedTextStyle = useAnimatedStyle(() => {
    const selected = selectedItemId?.value === uniqueId;
    return {
      color: selected ? animatedAccentColor?.value : labelTextColor,
      ...fontWithWidthWorklet(selected ? '700' : '600'),
    };
  });

  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={0.94}>
      <Animated.View style={[selectedStyle, controlPanelStyles.menuItem]}>
        <Columns alignVertical="center" space="12px">
          <Column width="content">
            <Box style={controlPanelStyles.menuItemIconContainer}>{IconComponent}</Box>
          </Column>
          <Stack space="10px">
            {renderLabelComponent?.(label) || (
              <AnimatedText numberOfLines={1} size="17pt" style={selectedTextStyle}>
                {label}
              </AnimatedText>
            )}
            {secondaryLabel && (
              <Text color={secondaryLabelColor || 'labelQuaternary'} numberOfLines={1} size="13pt" weight="bold">
                {secondaryLabel}
              </Text>
            )}
          </Stack>
        </Columns>
      </Animated.View>
    </ButtonPressAnimation>
  );
});

export const ListAvatar = React.memo(function ListAvatar({ size = 36, url }: { size?: number; url: string }) {
  return (
    <ImgixImage enableFasterImage size={size ?? 36} source={{ uri: url }} style={{ borderRadius: size / 2, height: size, width: size }} />
  );
});

export const ListEmojiAvatar = React.memo(function ListEmojiAvatar({
  address,
  color,
  label,
  size = 36,
}: {
  address: string;
  color: number | string;
  label: string;
  size?: number;
}) {
  const fillTertiary = useForegroundColor('fillTertiary');
  const emojiAvatar = returnStringFirstEmoji(label);
  const accountSymbol = returnStringFirstEmoji(emojiAvatar || addressHashedEmoji(address)) || '';

  const backgroundColor =
    typeof color === 'number'
      ? // sometimes the color is gonna be missing so we fallback to white
        // otherwise there will be only shadows without the the placeholder "circle"
        colors.avatarBackgrounds[color] ?? fillTertiary
      : color;

  return (
    <Box
      alignItems="center"
      borderRadius={size / 2}
      height={{ custom: size }}
      justifyContent="center"
      style={{ backgroundColor }}
      width={{ custom: size }}
    >
      <Text align="center" color="label" containsEmoji size="icon 18px" weight="heavy">
        {accountSymbol}
      </Text>
    </Box>
  );
});

export const Panel = ({ children, height }: { children?: React.ReactNode; height?: number }) => {
  const { isDarkMode } = useColorMode();
  const separatorSecondary = useForegroundColor('separatorSecondary');

  return (
    <Box
      style={[
        controlPanelStyles.panel,
        isDarkMode ? controlPanelStyles.panelBackgroundDark : controlPanelStyles.panelBackgroundLight,
        { height },
      ]}
    >
      {children}
      {IS_IOS && isDarkMode && (
        <Box style={controlPanelStyles.panelBorderContainer}>
          <Box style={[controlPanelStyles.panelBorder, { borderColor: separatorSecondary }]} />
        </Box>
      )}
    </Box>
  );
};

export const controlPanelStyles = StyleSheet.create({
  cover: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  listHeader: {
    alignItems: 'center',
    height: 65,
    justifyContent: 'center',
    width: '100%',
  },
  listHeaderButtonWrapper: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    left: -6,
    position: 'absolute',
    width: 52,
    zIndex: 10,
  },
  listHeaderContent: {
    alignItems: 'center',
    height: 64,
    justifyContent: 'center',
    width: '100%',
  },
  listHeaderRightComponent: {
    left: undefined,
    right: -6,
  },
  listPanel: {
    paddingHorizontal: 14,
    paddingTop: 2,
    width: '100%',
  },
  listScrollView: {
    marginHorizontal: -14,
    paddingHorizontal: 14,
    maxHeight: deviceUtils.dimensions.height - TOP_INSET - 91 * 2 - 65 - 56,
  },
  listScrollViewContentContainer: {
    paddingBottom: 14,
    paddingTop: 8,
  },
  logo: {
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  menuItem: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 10,
    width: '100%',
  },
  menuItemIconContainer: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  menuItemLarge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: IS_ANDROID ? 0 : THICK_BORDER_WIDTH,
    height: 60,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: IS_ANDROID ? 12 : 12 - THICK_BORDER_WIDTH,
    paddingRight: IS_ANDROID ? 16 : 16 - THICK_BORDER_WIDTH,
    paddingVertical: IS_ANDROID ? 12 : 12 - THICK_BORDER_WIDTH,
    width: '100%',
  },
  menuItemSelected: {
    borderWidth: IS_ANDROID ? 0 : THICK_BORDER_WIDTH,
    paddingLeft: IS_ANDROID ? 10 : 10 - THICK_BORDER_WIDTH,
    paddingRight: IS_ANDROID ? 14 : 14 - THICK_BORDER_WIDTH,
    paddingVertical: IS_ANDROID ? 10 : 10 - THICK_BORDER_WIDTH,
  },
  menuItemSelectedDark: {
    backgroundColor: globalColors.white10,
  },
  menuItemSelectedLight: {
    backgroundColor: '#FBFCFD',
  },
  panelContainer: {
    bottom: 91,
    pointerEvents: 'box-none',
    position: 'absolute',
    zIndex: 30000,
  },
  panelBorder: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: 42 - 2 / 3,
    borderWidth: THICK_BORDER_WIDTH,
    height: '100%',
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
  },
  panelBorderContainer: {
    backgroundColor: 'transparent',
    borderColor: opacity(globalColors.grey100, 0.4),
    borderCurve: 'continuous',
    borderWidth: 2 / 3,
    borderRadius: 42,
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  },
  panel: {
    borderCurve: 'continuous',
    borderRadius: 42,
    overflow: 'hidden',
    width: deviceUtils.dimensions.width - 16,
  },
  panelBackgroundDark: {
    backgroundColor: '#191A1C',
  },
  panelBackgroundLight: {
    backgroundColor: globalColors.white100,
  },
});
