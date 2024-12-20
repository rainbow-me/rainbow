/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { opacity } from '@/__swaps__/utils/swaps';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { AnimatedBlurView } from '@/components/AnimatedComponents/AnimatedBlurView';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { AnimatedText, Box, DesignSystemProvider, globalColors, Separator, Text, useBackgroundColor, useColorMode } from '@/design-system';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import * as i18n from '@/languages';
import deviceUtils, { DEVICE_WIDTH } from '@/utils/deviceUtils';
import MaskedView from '@react-native-masked-view/masked-view';
import chroma from 'chroma-js';
import { PropsWithChildren, useEffect } from 'react';
import React, { Pressable, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOutUp,
  LinearTransition,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  customizeNetworksBannerStore,
  defaultPinnedNetworks,
  dismissCustomizeNetworksBanner,
  networkSwitcherStore,
  shouldShowCustomizeNetworksBanner,
} from '@/state/networkSwitcher/networkSwitcher';
import { RootStackParamList } from '@/navigation/types';
import { IS_IOS } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { noop } from 'lodash';
import { TapToDismiss } from './DappBrowser/control-panel/ControlPanel';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useTheme } from '@/theme';

const t = i18n.l.network_switcher;

const translations = {
  edit: i18n.t(t.edit),
  done: i18n.t(i18n.l.done),
  networks: i18n.t(t.networks),
  more: i18n.t(t.more),
  show_more: i18n.t(t.show_more),
  show_less: i18n.t(t.show_less),
  drag_to_rearrange: i18n.t(t.drag_to_rearrange),
};

function EditButton({ editing }: { editing: SharedValue<boolean> }) {
  const blue = useForegroundColor('blue');
  const borderColor = chroma(blue).alpha(0.08).hex();

  const text = useDerivedValue(() => (editing.value ? translations.done : translations.edit));

  return (
    <ButtonPressAnimation
      onPress={() => {
        'worklet';
        editing.value = !editing.value;
      }}
      scaleTo={0.95}
      style={{
        borderColor,
        borderCurve: 'continuous',
        borderRadius: 14,
        borderWidth: THICK_BORDER_WIDTH,
        height: 28,
        justifyContent: 'center',
        overflow: 'hidden',
        paddingHorizontal: 10,
        position: 'absolute',
        right: 0,
      }}
    >
      <AnimatedText color="blue" size="17pt" weight="bold" style={{ shadowColor: '#268FFF', shadowOpacity: 0.4, shadowRadius: 12 }}>
        {text}
      </AnimatedText>
    </ButtonPressAnimation>
  );
}

function Header({ editing }: { editing: SharedValue<boolean> }) {
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const fill = useForegroundColor('fill');

  const title = useDerivedValue(() => {
    return editing.value ? translations.edit : translations.networks;
  });

  return (
    <View style={{ height: 66, borderBottomWidth: 1, borderBottomColor: separatorTertiary, paddingTop: 20 }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 6 }}>
        <View
          style={{
            height: 5,
            width: 36,
            marginHorizontal: 'auto',
            borderRadius: 3,
            borderCurve: 'continuous',
            backgroundColor: fill,
            overflow: 'hidden',
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 28 }}>
        <AnimatedText color="label" size="20pt" weight="heavy">
          {title}
        </AnimatedText>

        <EditButton editing={editing} />
      </View>
    </View>
  );
}

const CustomizeNetworksBanner = !shouldShowCustomizeNetworksBanner(customizeNetworksBannerStore.getState().dismissedAt)
  ? () => null
  : function CustomizeNetworksBanner({ editing }: { editing: SharedValue<boolean> }) {
      useAnimatedReaction(
        () => editing.value,
        (editing, prev) => {
          if (!prev && editing) runOnJS(dismissCustomizeNetworksBanner)();
        }
      );

      const dismissedAt = customizeNetworksBannerStore(s => s.dismissedAt);
      if (!shouldShowCustomizeNetworksBanner(dismissedAt)) return null;

      const height = 75;
      const blue = '#268FFF';

      return (
        <DesignSystemProvider colorMode="light">
          <Animated.View
            entering={FadeIn.duration(300).delay(600)}
            exiting={FadeOutUp.duration(200)}
            style={{ position: 'absolute', top: -(height + 14), left: 0, right: 0 }}
          >
            <MaskedView
              maskElement={
                <Svg width="100%" height={height} viewBox="0 0 353 75" fill="none">
                  <Path
                    d="M1.27368 16.2855C0 20.0376 0 24.6917 0 34C0 43.3083 0 47.9624 1.27368 51.7145C3.67205 58.7799 9.22007 64.3279 16.2855 66.7263C20.0376 68 24.6917 68 34 68H303.795C305.065 68 305.7 68 306.306 68.1265C306.844 68.2388 307.364 68.4243 307.851 68.6781C308.401 68.9641 308.892 69.3661 309.874 70.17L313.454 73.0986L313.454 73.0988C314.717 74.1323 315.349 74.6491 316.052 74.8469C316.672 75.0214 317.328 75.0214 317.948 74.8469C318.651 74.6491 319.283 74.1323 320.546 73.0988L320.546 73.0986L324.269 70.0528C325.203 69.2882 325.671 68.9059 326.166 68.6362C326.634 68.3817 327.044 68.2214 327.56 68.0907C328.107 67.9521 328.787 67.911 330.146 67.8287C332.84 67.6657 334.885 67.3475 336.715 66.7263C343.78 64.3279 349.328 58.7799 351.726 51.7145C353 47.9624 353 43.3083 353 34C353 24.6917 353 20.0376 351.726 16.2855C349.328 9.22007 343.78 3.67205 336.715 1.27368C332.962 0 328.308 0 319 0H34C24.6917 0 20.0376 0 16.2855 1.27368C9.22007 3.67205 3.67205 9.22007 1.27368 16.2855Z"
                    fill="black"
                  />
                </Svg>
              }
            >
              <AnimatedBlurView blurType="xlight" blurAmount={6} style={{ height }}>
                <View
                  style={{
                    flexDirection: 'row',
                    height: 68,
                    flex: 1,
                    padding: 16 + 12,
                    gap: 12,
                    alignItems: 'center',
                    marginTop: 68 - height,
                  }}
                >
                  <LinearGradient
                    colors={['#268FFF1F', '#268FFF14']}
                    angle={135}
                    useAngle
                    style={{
                      height: 36,
                      width: 36,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#268FFF0D',
                      backgroundColor: '#268FFF14',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text weight="heavy" size="17pt" color={{ custom: blue }}>
                      􀍱
                    </Text>
                  </LinearGradient>
                  <View style={{ gap: 10 }}>
                    <Text weight="heavy" size="15pt" color="labelSecondary">
                      {i18n.t(t.customize_networks_banner.title)}
                    </Text>
                    <Text weight="semibold" size="13pt" color="labelQuaternary">
                      {i18n.t(t.customize_networks_banner.tap_the)}{' '}
                      <Text weight="bold" size="13pt" color={{ custom: blue }}>
                        {i18n.t(t.edit)}
                      </Text>{' '}
                      {i18n.t(t.customize_networks_banner.button_to_set_up)}
                    </Text>
                  </View>
                  <Pressable style={{ marginLeft: 'auto', height: '100%' }} onPress={dismissCustomizeNetworksBanner}>
                    <Text weight="heavy" size="13pt" color="labelQuaternary">
                      􀆄
                    </Text>
                  </Pressable>
                </View>
              </AnimatedBlurView>
            </MaskedView>
          </Animated.View>
        </DesignSystemProvider>
      );
    };

const BADGE_BORDER_COLORS = {
  default: {
    dark: globalColors.white10,
    light: '#F2F3F4',
  },
  selected: {
    dark: '#1E2E40',
    light: '#D7E9FD',
  },
};

const useNetworkOptionStyle = (isSelected: SharedValue<boolean>, color?: string) => {
  const { isDarkMode } = useColorMode();
  const label = useForegroundColor('labelTertiary');

  const surfacePrimary = useBackgroundColor('surfacePrimary');
  const networkSwitcherBackgroundColor = isDarkMode ? '#191A1C' : surfacePrimary;
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const defaultStyle = {
    backgroundColor: isDarkMode ? globalColors.white10 : globalColors.grey20,
    borderColor: isDarkMode ? opacity(separatorTertiary, 0.02) : separatorTertiary,
  };
  const selectedStyle = {
    backgroundColor: chroma
      .scale([networkSwitcherBackgroundColor, color || label])(0.16)
      .hex(),
    borderColor: chroma(color || label)
      .alpha(0.16)
      .hex(),
  };

  const scale = useSharedValue(1);
  useAnimatedReaction(
    () => isSelected.value,
    (current, prev) => {
      if (current === true && prev === false) {
        scale.value = withSequence(
          withTiming(0.9, { duration: 120, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }),
          withTiming(1, TIMING_CONFIGS.fadeConfig)
        );
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    const colors = isSelected.value ? selectedStyle : defaultStyle;
    return {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      transform: [{ scale: scale.value }],
    };
  });

  return {
    animatedStyle,
    selectedStyle,
    defaultStyle,
  };
};

function AllNetworksOption({
  selected,
  setSelected,
}: {
  selected: SharedValue<ChainId | undefined>;
  setSelected: (chainId: ChainId | undefined) => void;
}) {
  const { isDarkMode } = useColorMode();
  const blue = useForegroundColor('blue');

  const isSelected = useDerivedValue(() => selected.value === undefined);
  const { animatedStyle } = useNetworkOptionStyle(isSelected, blue);

  const overlappingBadge = useAnimatedStyle(() => {
    return {
      borderColor: isSelected.value
        ? BADGE_BORDER_COLORS.selected[isDarkMode ? 'dark' : 'light']
        : BADGE_BORDER_COLORS.default[isDarkMode ? 'dark' : 'light'],
    };
  });

  return (
    <GestureHandlerButton
      onPressWorklet={() => {
        'worklet';
        setSelected(undefined);
      }}
      scaleTo={0.95}
    >
      <Animated.View
        style={[
          {
            height: ITEM_HEIGHT,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 24,
            borderWidth: THICK_BORDER_WIDTH,
            borderCurve: 'continuous',
            overflow: 'hidden',
          },
          animatedStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', marginLeft: 20 }}>
          <Animated.View style={[sx.overlappingBadge, overlappingBadge]}>
            <ChainImage chainId={ChainId.base} size={16} />
          </Animated.View>
          <Animated.View style={[sx.overlappingBadge, overlappingBadge]}>
            <ChainImage chainId={ChainId.mainnet} size={16} />
          </Animated.View>
          <Animated.View style={[sx.overlappingBadge, overlappingBadge]}>
            <ChainImage chainId={ChainId.optimism} size={16} />
          </Animated.View>
          <Animated.View style={[sx.overlappingBadge, overlappingBadge]}>
            <ChainImage chainId={ChainId.arbitrum} size={16} />
          </Animated.View>
        </View>
        <Text color="label" size="17pt" weight="bold" style={{ textAlign: 'center', flex: 1 }}>
          {i18n.t(t.all_networks)}
        </Text>
      </Animated.View>
    </GestureHandlerButton>
  );
}

function AllNetworksSection({
  editing,
  setSelected,
  selected,
}: {
  editing: SharedValue<boolean>;
  setSelected: (chainId: ChainId | undefined) => void;
  selected: SharedValue<ChainId | undefined>;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: editing.value ? withTiming(0, TIMING_CONFIGS.fastFadeConfig) : withTiming(1, TIMING_CONFIGS.fastFadeConfig),
    height: withTiming(
      editing.value ? 0 : ITEM_HEIGHT + 14, // 14 is the gap to the separator
      TIMING_CONFIGS.fastFadeConfig
    ),
    marginTop: editing.value ? 0 : 14,
    pointerEvents: editing.value ? 'none' : 'auto',
  }));
  return (
    <Animated.View style={[style, { gap: 14 }]}>
      <AllNetworksOption selected={selected} setSelected={setSelected} />
      <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
    </Animated.View>
  );
}

function NetworkOption({ chainId, selected }: { chainId: ChainId; selected: SharedValue<ChainId | undefined> }) {
  const { colors } = useTheme();
  const chainName = useBackendNetworksStore.getState().getChainsLabel()[chainId];
  const chainColor = colors.networkColors[chainId] ? colors.networkColors[chainId] : undefined;
  const isSelected = useDerivedValue(() => selected.value === chainId);
  const { animatedStyle } = useNetworkOptionStyle(isSelected, chainColor);

  return (
    <Animated.View
      layout={LinearTransition.springify().mass(0.4)}
      style={[
        {
          alignItems: 'center',
          borderCurve: 'continuous',
          borderRadius: 24,
          borderWidth: THICK_BORDER_WIDTH,
          flexDirection: 'row',
          height: ITEM_HEIGHT,
          overflow: 'hidden',
          paddingHorizontal: 12,
          width: ITEM_WIDTH,
        },
        animatedStyle,
      ]}
    >
      <ChainImage chainId={chainId} size={24} />
      <Text color="label" size="17pt" weight="bold" style={{ textAlign: 'center', flex: 1 }}>
        {chainName}
      </Text>
    </Animated.View>
  );
}

const SHEET_OUTER_INSET = 8;
const SHEET_INNER_PADDING = 16;
const GAP = 12;
const ITEM_WIDTH = (DEVICE_WIDTH - SHEET_INNER_PADDING * 2 - SHEET_OUTER_INSET * 2 - GAP) / 2;
const ITEM_HEIGHT = 48;
const SEPARATOR_HEIGHT = 68;

const ALL_NETWORKS_BADGE_SIZE = 16;
const THICKER_BORDER_WIDTH = 5 / 3;

const enum Section {
  pinned,
  separator,
  unpinned,
}

function Draggable({
  children,
  dragging,
  chainId,
  networks,
  sectionsOffsets,
  isUnpinnedHidden,
}: PropsWithChildren<{
  chainId: ChainId;
  dragging: SharedValue<DraggingState | null>;
  networks: SharedValue<Record<Section.pinned | Section.unpinned, ChainId[]>>;
  sectionsOffsets: SharedValue<Record<Section, { y: number }>>;
  isUnpinnedHidden: SharedValue<boolean>;
}>) {
  const zIndex = useSharedValue(0);
  useAnimatedReaction(
    () => dragging.value?.chainId,
    (current, prev) => {
      if (current === prev) return;
      if (current === chainId) zIndex.value = 2;
      if (prev === chainId) zIndex.value = 1;
    }
  );

  const draggableStyles = useAnimatedStyle(() => {
    const section = networks.value[Section.pinned].includes(chainId) ? Section.pinned : Section.unpinned;
    const itemIndex = networks.value[section].indexOf(chainId);
    const slotPosition = positionFromIndex(itemIndex, sectionsOffsets.value[section]);

    const opacity =
      section === Section.unpinned && isUnpinnedHidden.value
        ? withTiming(0, TIMING_CONFIGS.fastFadeConfig)
        : withDelay(100, withTiming(1, TIMING_CONFIGS.fadeConfig));

    const isBeingDragged = dragging.value?.chainId === chainId;
    const position = isBeingDragged ? dragging.value!.position : slotPosition;

    return {
      opacity,
      zIndex: zIndex.value,
      transform: [
        { scale: withSpring(isBeingDragged ? 1.05 : 1, SPRING_CONFIGS.springConfig) },
        { translateX: isBeingDragged ? position.x : withSpring(position.x, SPRING_CONFIGS.springConfig) },
        { translateY: isBeingDragged ? position.y : withSpring(position.y, SPRING_CONFIGS.springConfig) },
      ],
    };
  });

  return <Animated.View style={[{ position: 'absolute' }, draggableStyles]}>{children}</Animated.View>;
}

const indexFromPosition = (x: number, y: number, offset: { y: number }) => {
  'worklet';
  const yoffsets = y > offset.y ? offset.y : 0;
  const column = x > ITEM_WIDTH + GAP / 2 ? 1 : 0;
  const row = Math.floor((y - yoffsets) / (ITEM_HEIGHT + GAP));
  const index = row * 2 + column;
  return index < 0 ? 0 : index; // row can be negative if the dragged item is above the first row
};

const positionFromIndex = (index: number, offset: { y: number }) => {
  'worklet';
  const column = index % 2;
  const row = Math.floor(index / 2);
  const position = { x: column * (ITEM_WIDTH + GAP), y: row * (ITEM_HEIGHT + GAP) + offset.y };
  return position;
};

type Point = { x: number; y: number };
type DraggingState = {
  chainId: ChainId;
  position: Point;
};

function SectionSeparator({
  sectionsOffsets,
  editing,
  expanded,
  networks,
}: {
  sectionsOffsets: SharedValue<Record<Section, { y: number }>>;
  editing: SharedValue<boolean>;
  expanded: SharedValue<boolean>;
  networks: SharedValue<Record<Section.pinned | Section.unpinned, ChainId[]>>;
}) {
  const pressed = useSharedValue(false);

  const showExpandButtonAsNetworkChip = useDerivedValue(() => {
    return !expanded.value && !editing.value && networks.value[Section.pinned].length % 2 !== 0;
  });

  const visible = useDerivedValue(() => {
    return networks.value[Section.unpinned].length > 0 || editing.value;
  });

  const tapExpand = Gesture.Tap()
    .onTouchesDown((e, s) => {
      if (editing.value || !visible.value) return s.fail();
      pressed.value = true;
    })
    .onEnd(() => {
      pressed.value = false;
      expanded.value = !expanded.value;
    });

  const text = useDerivedValue(() => {
    if (editing.value) return translations.drag_to_rearrange;
    if (showExpandButtonAsNetworkChip.value) return translations.more;
    return expanded.value ? translations.show_less : translations.show_more;
  });

  const unpinnedNetworksLength = useDerivedValue(() => networks.value[Section.unpinned].length.toString());
  const showMoreAmountStyle = useAnimatedStyle(() => ({
    opacity: expanded.value || editing.value ? 0 : 1,
  }));
  const showMoreOrLessIcon = useDerivedValue(() => (expanded.value ? '􀆇' : '􀆈') as string);
  const showMoreOrLessIconStyle = useAnimatedStyle(() => ({ opacity: editing.value ? 0 : 1 }));

  const { isDarkMode } = useColorMode();

  const separatorContainerStyles = useAnimatedStyle(() => {
    if (showExpandButtonAsNetworkChip.value) {
      const position = positionFromIndex(networks.value[Section.pinned].length, sectionsOffsets.value[Section.pinned]);
      return {
        backgroundColor: isDarkMode ? globalColors.white10 : globalColors.grey20,
        borderColor: '#F5F8FF05',
        height: ITEM_HEIGHT,
        width: ITEM_WIDTH,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: THICK_BORDER_WIDTH,
        transform: [{ translateX: position.x }, { translateY: position.y }],
      };
    }

    return {
      backgroundColor: 'transparent',
      opacity: visible.value ? 1 : 0,
      transform: [{ translateY: sectionsOffsets.value[Section.separator].y }, { scale: withTiming(pressed.value ? 0.95 : 1) }],
      position: 'absolute',
      width: '100%',
      height: SEPARATOR_HEIGHT,
    };
  });

  return (
    <GestureDetector gesture={tapExpand}>
      <Animated.View style={[separatorContainerStyles, { gap: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }]}>
        <Animated.View
          style={[
            {
              backgroundColor: isDarkMode ? '#F5F8FF05' : '#1B1D1F0f',
              height: 24,
              width: 24,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            },
            showMoreAmountStyle,
          ]}
        >
          <AnimatedText color="labelQuaternary" weight="bold" size="15pt" align="center">
            {unpinnedNetworksLength}
          </AnimatedText>
        </Animated.View>
        <AnimatedText color="labelQuaternary" weight="bold" size="17pt">
          {text}
        </AnimatedText>
        <Animated.View style={[{ width: 24, justifyContent: 'center' }, showMoreOrLessIconStyle]}>
          <AnimatedText color="labelQuaternary" weight="heavy" size="13pt">
            {showMoreOrLessIcon}
          </AnimatedText>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function EmptyUnpinnedPlaceholder({
  sectionsOffsets,
  networks,
  isUnpinnedHidden,
}: {
  sectionsOffsets: SharedValue<Record<Section, { y: number }>>;
  networks: SharedValue<Record<Section.pinned | Section.unpinned, ChainId[]>>;
  isUnpinnedHidden: SharedValue<boolean>;
}) {
  const styles = useAnimatedStyle(() => {
    const isVisible = networks.value[Section.unpinned].length === 0 && !isUnpinnedHidden.value;
    return {
      opacity: isVisible ? withTiming(1, { duration: 800 }) : 0,
      transform: [{ translateY: sectionsOffsets.value[Section.unpinned].y }],
    };
  });
  const { isDarkMode } = useColorMode();
  return (
    <Animated.View
      style={[
        { height: 48, width: '100%' },
        { paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
        { borderRadius: 24, borderWidth: THICK_BORDER_WIDTH },
        { backgroundColor: isDarkMode ? globalColors.white10 : globalColors.grey20, borderColor: '#F5F8FF05' },
        styles,
      ]}
    >
      <Text color="labelQuaternary" size="15pt" weight="semibold" align="center" style={{ flex: 1 }}>
        {i18n.t(t.drag_here_to_unpin)}
      </Text>
    </Animated.View>
  );
}

function NetworksGrid({
  editing,
  setSelected,
  selected,
}: {
  editing: SharedValue<boolean>;
  setSelected: (chainId: ChainId | undefined) => void;
  selected: SharedValue<ChainId | undefined>;
}) {
  const initialPinned = networkSwitcherStore.getState().pinnedNetworks;
  const sortedSupportedChainIds = useBackendNetworksStore.getState().getSortedSupportedChainIds();
  const initialUnpinned = sortedSupportedChainIds.filter(chainId => !initialPinned.includes(chainId));
  const networks = useSharedValue({ [Section.pinned]: initialPinned, [Section.unpinned]: initialUnpinned });

  useEffect(() => {
    // persists pinned networks when closing the sheet
    // should be the only time this component is unmounted
    return () => {
      if (networks.value[Section.pinned].length > 0) {
        networkSwitcherStore.setState({ pinnedNetworks: networks.value[Section.pinned] });
      } else {
        networkSwitcherStore.setState({ pinnedNetworks: defaultPinnedNetworks });
      }
    };
  }, [networks]);

  const expanded = useSharedValue(false);
  const isUnpinnedHidden = useDerivedValue(() => !expanded.value && !editing.value);

  const dragging = useSharedValue<DraggingState | null>(null);

  const sectionsOffsets = useDerivedValue(() => {
    const pinnedHeight = Math.ceil(networks.value[Section.pinned].length / 2) * (ITEM_HEIGHT + GAP) - GAP;
    return {
      [Section.pinned]: { y: 0 },
      [Section.separator]: { y: pinnedHeight },
      [Section.unpinned]: { y: pinnedHeight + SEPARATOR_HEIGHT },
    };
  });
  const containerHeight = useDerivedValue(() => {
    const length = networks.value[Section.unpinned].length;
    const paddingBottom = 32;
    const unpinnedHeight = isUnpinnedHidden.value
      ? length === 0
        ? -SEPARATOR_HEIGHT + paddingBottom
        : 0
      : length === 0
        ? ITEM_HEIGHT + paddingBottom
        : Math.ceil((length + 1) / 2) * (ITEM_HEIGHT + GAP) - GAP + paddingBottom;
    const height = sectionsOffsets.value[Section.unpinned].y + unpinnedHeight;
    return height;
  });
  const containerStyle = useAnimatedStyle(() => ({
    height: withDelay(expanded.value ? 0 : 25, withTiming(containerHeight.value, TIMING_CONFIGS.slowerFadeConfig)),
  }));

  const dragNetwork = Gesture.Pan()
    .maxPointers(1)
    .onTouchesDown((e, s) => {
      if (!editing.value) {
        s.fail();
        return;
      }
      const touch = e.allTouches[0];
      const section = touch.y > sectionsOffsets.value[Section.unpinned].y ? Section.unpinned : Section.pinned;
      const sectionOffset = sectionsOffsets.value[section];
      const index = indexFromPosition(touch.x, touch.y, sectionOffset);
      const sectionNetworks = networks.value[section];
      const chainId = sectionNetworks[index];

      if (!chainId || (section === Section.pinned && sectionNetworks.length === 1)) {
        s.fail();
        return;
      }

      const position = positionFromIndex(index, sectionOffset);
      dragging.value = { chainId, position };
    })
    .onChange(e => {
      if (!dragging.value) return;
      const chainId = dragging.value.chainId;
      if (!chainId) return;

      const section = e.y > sectionsOffsets.value[Section.unpinned].y - SEPARATOR_HEIGHT / 2 ? Section.unpinned : Section.pinned;
      const sectionArray = networks.value[section];

      const currentIndex = sectionArray.indexOf(chainId);
      const newIndex = Math.min(indexFromPosition(e.x, e.y, sectionsOffsets.value[section]), sectionArray.length - 1);

      networks.modify(networks => {
        if (currentIndex === -1) {
          // Pin/Unpin
          if (section === Section.unpinned) networks[Section.pinned].splice(currentIndex, 1);
          else networks[Section.pinned].push(chainId);
          networks[Section.unpinned] = sortedSupportedChainIds.filter(chainId => !networks[Section.pinned].includes(chainId));
        } else if (section === Section.pinned && newIndex !== currentIndex) {
          // Reorder
          networks[Section.pinned].splice(currentIndex, 1);
          networks[Section.pinned].splice(newIndex, 0, chainId);
        }
        return networks;
      });
      dragging.modify(dragging => {
        if (!dragging) return dragging;
        dragging.position.x += e.changeX;
        dragging.position.y += e.changeY;
        return dragging;
      });
    })
    .onFinalize(() => {
      dragging.value = null;
    });

  const tapNetwork = Gesture.Tap()
    .onTouchesDown((e, s) => {
      if (editing.value) return s.fail();
    })
    .onEnd(e => {
      const section = e.y > sectionsOffsets.value[Section.unpinned].y ? Section.unpinned : Section.pinned;
      const index = indexFromPosition(e.x, e.y, sectionsOffsets.value[section]);
      const chainId = networks.value[section][index];
      if (!chainId) return;

      setSelected(chainId);
    });

  const gridGesture = Gesture.Exclusive(dragNetwork, tapNetwork);

  return (
    <GestureDetector gesture={gridGesture}>
      <Animated.View style={[containerStyle, { marginTop: 14 }]}>
        {initialPinned.map(chainId => (
          <Draggable
            key={chainId}
            networks={networks}
            dragging={dragging}
            chainId={chainId}
            sectionsOffsets={sectionsOffsets}
            isUnpinnedHidden={isUnpinnedHidden}
          >
            <NetworkOption key={chainId} chainId={chainId} selected={selected} />
          </Draggable>
        ))}

        <SectionSeparator sectionsOffsets={sectionsOffsets} expanded={expanded} editing={editing} networks={networks} />

        <EmptyUnpinnedPlaceholder sectionsOffsets={sectionsOffsets} networks={networks} isUnpinnedHidden={isUnpinnedHidden} />

        {initialUnpinned.map(chainId => (
          <Draggable
            key={chainId}
            networks={networks}
            dragging={dragging}
            chainId={chainId}
            sectionsOffsets={sectionsOffsets}
            isUnpinnedHidden={isUnpinnedHidden}
          >
            <NetworkOption key={chainId} chainId={chainId} selected={selected} />
          </Draggable>
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

function Sheet({ children, editing, onClose }: PropsWithChildren<{ editing: SharedValue<boolean>; onClose: VoidFunction }>) {
  const { isDarkMode } = useColorMode();
  const surfacePrimary = useBackgroundColor('surfacePrimary');
  const backgroundColor = isDarkMode ? '#191A1C' : surfacePrimary;
  const separatorSecondary = useForegroundColor('separatorSecondary');

  // make sure the onClose function is called when the sheet unmounts
  useEffect(() => {
    return () => onClose?.();
  }, [onClose]);

  return (
    <>
      <Box
        style={[
          sx.sheet,
          {
            backgroundColor,
            borderColor: isDarkMode ? separatorSecondary : globalColors.white100,
          },
        ]}
      >
        <Header editing={editing} />
        {children}
      </Box>
      <TapToDismiss />
    </>
  );
}

export function NetworkSelector() {
  const {
    params: { onClose = noop, selected, setSelected },
  } = useRoute<RouteProp<RootStackParamList, 'NetworkSelector'>>();

  const editing = useSharedValue(false);

  return (
    <Sheet editing={editing} onClose={onClose}>
      <CustomizeNetworksBanner editing={editing} />
      <AllNetworksSection editing={editing} setSelected={setSelected} selected={selected} />
      <NetworksGrid editing={editing} setSelected={setSelected} selected={selected} />
    </Sheet>
  );
}

const sx = StyleSheet.create({
  overlappingBadge: {
    borderWidth: THICKER_BORDER_WIDTH,
    borderRadius: ALL_NETWORKS_BADGE_SIZE,
    marginLeft: -9,
    width: ALL_NETWORKS_BADGE_SIZE + THICKER_BORDER_WIDTH * 2,
    height: ALL_NETWORKS_BADGE_SIZE + THICKER_BORDER_WIDTH * 2,
  },
  sheet: {
    flex: 1,
    width: deviceUtils.dimensions.width - 16,
    bottom: Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30),
    pointerEvents: 'box-none',
    position: 'absolute',
    zIndex: 30000,
    left: 8,
    right: 8,
    paddingHorizontal: 16,
    borderCurve: 'continuous',
    borderRadius: 42,
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
  },
});
