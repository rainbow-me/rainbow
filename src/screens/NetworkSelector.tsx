import { BlurView } from 'react-native-blur-view';
import { opacity } from '@/__swaps__/utils/swaps';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import {
  AnimatedText,
  Box,
  DesignSystemProvider,
  globalColors,
  Inset,
  Separator,
  Text,
  TextShadow,
  useBackgroundColor,
  useColorMode,
} from '@/design-system';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import * as i18n from '@/languages';
import deviceUtils, { DEVICE_WIDTH } from '@/utils/deviceUtils';
import MaskedView from '@react-native-masked-view/masked-view';
import chroma from 'chroma-js';
import { PropsWithChildren, useCallback, useEffect } from 'react';
import React, { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOutUp,
  interpolate,
  LinearTransition,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withClamp,
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
import { TapToDismiss } from '@/components/DappBrowser/control-panel/ControlPanel';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { useNavigation } from '@/navigation';
import { UserAssetFilter } from '@/__swaps__/types/assets';
import Routes from '@/navigation/routesNames';

type RouteParams = RouteProp<RootStackParamList, 'NetworkSelector'>['params'];

type NetworkSwitcherProps = RouteParams & {
  editing: SharedValue<boolean>;
  selected: SharedValue<ChainId | UserAssetFilter | undefined>;
};

const enum Section {
  pinned,
  separator,
  unpinned,
}

const t = i18n.l.network_selector;
const MAX_HEIGHT = deviceUtils.dimensions.height * 0.875 - safeAreaInsetValues.top;
const HEADER_HEIGHT = 66;
const FOOTER_HEIGHT = 91;
const BANNER_HEIGHT = 75;
const SHEET_OUTER_INSET = 8;
const SHEET_INNER_PADDING = 18;
const ITEM_GAP = 12;
const ITEM_WIDTH = (DEVICE_WIDTH - SHEET_INNER_PADDING * 2 - SHEET_OUTER_INSET * 2 - ITEM_GAP) / 2;
const ITEM_HEIGHT = 48;
const MASTHEAD_BUTTON_HEIGHT = ITEM_HEIGHT + 14 * 2;
const SEPARATOR_HEIGHT = 68;
const SEPARATOR_HEIGHT_NETWORK_CHIP = 18;
const SHEET_WIDTH = deviceUtils.dimensions.width - 16;
const ALL_NETWORKS_BADGE_SIZE = 16;
const THICKER_BORDER_WIDTH = 5 / 3;

const ALL_BADGE_BORDER_COLORS = {
  default: {
    dark: globalColors.white10,
    light: '#F2F3F4',
  },
  selected: {
    dark: '#1E2E40',
    light: '#D7E9FD',
  },
};

const translations = {
  edit: i18n.t(t.edit),
  done: i18n.t(i18n.l.done),
  network: i18n.t(t.network),
  more: i18n.t(t.more),
  show_more: i18n.t(t.show_more),
  show_less: i18n.t(t.show_less),
  drag_to_rearrange: i18n.t(t.drag_to_rearrange),
};

function EditButton({ editing }: Pick<NetworkSwitcherProps, 'editing'>) {
  const blue = useForegroundColor('blue');
  const borderColor = chroma(blue).alpha(0.08).hex();

  const text = useDerivedValue(() => (editing.value ? translations.done : translations.edit));

  return (
    <ButtonPressAnimation
      onPress={() => {
        'worklet';
        editing.value = !editing.value;
      }}
      style={[sx.editButton, { borderColor }]}
    >
      <TextShadow blur={12} shadowOpacity={0.4}>
        <AnimatedText align="center" color="blue" size="17pt" weight="bold">
          {text}
        </AnimatedText>
      </TextShadow>
    </ButtonPressAnimation>
  );
}

function Header({ title, canEdit, editing }: Pick<NetworkSwitcherProps, 'title' | 'canEdit' | 'editing'>) {
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const fill = useForegroundColor('fill');

  const titleValue = useDerivedValue(() => {
    return editing.value ? translations.edit : title;
  });

  return (
    <View style={[sx.headerContainer, { borderBottomColor: separatorTertiary }]}>
      <View style={[sx.sheetHandle, { backgroundColor: fill }]} />

      <View style={sx.headerContent}>
        <AnimatedText align="center" color="label" size="20pt" style={{ width: '100%' }} weight="heavy">
          {titleValue}
        </AnimatedText>

        {canEdit && <EditButton editing={editing} />}
      </View>
    </View>
  );
}

const CustomizeNetworksBanner = !shouldShowCustomizeNetworksBanner(customizeNetworksBannerStore.getState().dismissedAt)
  ? () => null
  : function CustomizeNetworksBanner({ editing }: Pick<NetworkSwitcherProps, 'editing'>) {
      useAnimatedReaction(
        () => editing.value,
        (editing, prev) => {
          if (!prev && editing) runOnJS(dismissCustomizeNetworksBanner)();
        }
      );

      const dismissedAt = customizeNetworksBannerStore(s => s.dismissedAt);
      if (!shouldShowCustomizeNetworksBanner(dismissedAt)) return null;

      const blue = '#268FFF';

      return (
        <DesignSystemProvider colorMode="light">
          <Animated.View entering={FadeIn.duration(300).delay(600)} exiting={FadeOutUp.duration(200)} style={sx.banner}>
            <MaskedView
              maskElement={
                <Svg width="100%" height={BANNER_HEIGHT} viewBox="0 0 353 75" fill="none">
                  <Path
                    d="M1.27368 16.2855C0 20.0376 0 24.6917 0 34C0 43.3083 0 47.9624 1.27368 51.7145C3.67205 58.7799 9.22007 64.3279 16.2855 66.7263C20.0376 68 24.6917 68 34 68H303.795C305.065 68 305.7 68 306.306 68.1265C306.844 68.2388 307.364 68.4243 307.851 68.6781C308.401 68.9641 308.892 69.3661 309.874 70.17L313.454 73.0986L313.454 73.0988C314.717 74.1323 315.349 74.6491 316.052 74.8469C316.672 75.0214 317.328 75.0214 317.948 74.8469C318.651 74.6491 319.283 74.1323 320.546 73.0988L320.546 73.0986L324.269 70.0528C325.203 69.2882 325.671 68.9059 326.166 68.6362C326.634 68.3817 327.044 68.2214 327.56 68.0907C328.107 67.9521 328.787 67.911 330.146 67.8287C332.84 67.6657 334.885 67.3475 336.715 66.7263C343.78 64.3279 349.328 58.7799 351.726 51.7145C353 47.9624 353 43.3083 353 34C353 24.6917 353 20.0376 351.726 16.2855C349.328 9.22007 343.78 3.67205 336.715 1.27368C332.962 0 328.308 0 319 0H34C24.6917 0 20.0376 0 16.2855 1.27368C9.22007 3.67205 3.67205 9.22007 1.27368 16.2855Z"
                    fill="black"
                  />
                </Svg>
              }
            >
              <BlurView blurStyle="extraLight" blurIntensity={6} style={sx.bannerBlurView} />
              <View style={sx.bannerContent}>
                <LinearGradient colors={['#268FFF1F', '#268FFF14']} angle={135} useAngle style={sx.bannerGradient}>
                  <Text color={{ custom: blue }} size="17pt" weight="heavy">
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
            </MaskedView>
          </Animated.View>
        </DesignSystemProvider>
      );
    };

const useNetworkOptionStyle = (isSelected: SharedValue<boolean>, color?: string, disableScale = false) => {
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
    () => (disableScale ? false : isSelected.value),
    (current, prev) => {
      if (current === true && prev === false) {
        scale.value = withSequence(
          withTiming(0.93, { duration: 110, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }),
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
  canSelect,
  selected,
  setSelected,
  goBackOnSelect,
  actionButton,
}: Pick<NetworkSwitcherProps, 'canSelect' | 'selected' | 'setSelected' | 'goBackOnSelect' | 'actionButton'>) {
  const { isDarkMode } = useColorMode();
  const color = useForegroundColor(actionButton?.color || 'blue');
  const { goBack } = useNavigation();

  const isSelected = useDerivedValue(() => selected.value === undefined);
  const { animatedStyle } = useNetworkOptionStyle(isSelected, color, true);

  const label = actionButton?.label || i18n.t(t.all_networks);

  const overlappingBadge = useAnimatedStyle(() => {
    return {
      borderColor: isSelected.value
        ? ALL_BADGE_BORDER_COLORS.selected[isDarkMode ? 'dark' : 'light']
        : ALL_BADGE_BORDER_COLORS.default[isDarkMode ? 'dark' : 'light'],
    };
  });

  const onActionButtonPress = useCallback(() => {
    'worklet';
    selected.value = undefined;

    if (actionButton?.onPress) {
      runOnJS(actionButton.onPress)();
    } else {
      runOnJS(setSelected)(undefined);
    }

    if (goBackOnSelect) {
      runOnJS(goBack)();
    }
  }, [actionButton?.onPress]);

  return (
    <GestureHandlerButton
      disabled={!canSelect}
      hapticTrigger="tap-end"
      onPressWorklet={onActionButtonPress}
      scaleTo={0.94}
      style={[sx.allNetworksButton, animatedStyle]}
    >
      <View style={sx.allNetworksCoinIcons}>
        {actionButton?.icon ? (
          <Text align="center" color={actionButton.color || 'blue'} size={'icon 23px'} weight={actionButton.weight || 'bold'}>
            {actionButton.icon}
          </Text>
        ) : (
          <>
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
          </>
        )}
      </View>
      <Text align="center" color="label" size="17pt" weight="bold" style={sx.flex}>
        {label}
      </Text>
    </GestureHandlerButton>
  );
}

function AllNetworksSection({
  canSelect,
  editing,
  selected,
  setSelected,
  goBackOnSelect,
  actionButton,
}: Pick<NetworkSwitcherProps, 'canSelect' | 'editing' | 'selected' | 'setSelected' | 'goBackOnSelect' | 'actionButton'>) {
  const animatedStyle = useAnimatedStyle(() => ({
    height: withClamp(
      { min: 0, max: MASTHEAD_BUTTON_HEIGHT },
      withSpring(
        editing.value ? 0 : MASTHEAD_BUTTON_HEIGHT, // 14 is the gap to the separator
        SPRING_CONFIGS.springConfig
      )
    ),
    opacity: editing.value ? withSpring(0, SPRING_CONFIGS.snappierSpringConfig) : withTiming(1, TIMING_CONFIGS.slowerFadeConfig),
    pointerEvents: editing.value ? 'none' : 'auto',
  }));

  return (
    <Animated.View style={[sx.allNetworksContainer, animatedStyle]}>
      <AllNetworksOption
        canSelect={canSelect}
        selected={selected}
        setSelected={setSelected}
        goBackOnSelect={goBackOnSelect}
        actionButton={actionButton}
      />
      <Inset horizontal="10px">
        <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
      </Inset>
    </Animated.View>
  );
}

function NetworkOption({ chainId, selected }: Pick<NetworkSwitcherProps, 'selected'> & { chainId: ChainId }) {
  const { isDarkMode } = useColorMode();
  const chainColor = useBackendNetworksStore.getState().getColorsForChainId(chainId, isDarkMode);
  const chainName = useBackendNetworksStore.getState().getChainsLabel()[chainId];
  const isSelected = useDerivedValue(() => selected.value === chainId);
  const { animatedStyle } = useNetworkOptionStyle(isSelected, chainColor);

  return (
    <Animated.View layout={LinearTransition.springify().mass(0.4)} style={[sx.networkOption, animatedStyle]}>
      <ChainImage chainId={chainId} position="relative" size={24} />
      <Text align="center" color="label" size="17pt" weight="bold" style={sx.flex}>
        {chainName}
      </Text>
    </Animated.View>
  );
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

    const isBeingDragged = dragging.value?.chainId === chainId;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const position = isBeingDragged ? dragging.value!.position : slotPosition;

    return {
      opacity: withSpring(section === Section.unpinned && isUnpinnedHidden.value ? 0 : 1, SPRING_CONFIGS.snappierSpringConfig),
      transform: [
        { translateX: isBeingDragged ? position.x : withSpring(position.x, SPRING_CONFIGS.springConfig) },
        { translateY: isBeingDragged ? position.y : withSpring(position.y, SPRING_CONFIGS.springConfig) },
        { scale: withSpring(isBeingDragged ? 1.075 : 1, SPRING_CONFIGS.springConfig) },
      ],
      zIndex: zIndex.value,
    };
  });

  return <Animated.View style={[sx.positionAbsolute, draggableStyles]}>{children}</Animated.View>;
}

const indexFromPosition = (x: number, y: number, offset: { y: number }) => {
  'worklet';
  const yoffsets = y > offset.y ? offset.y : 0;
  const column = x > ITEM_WIDTH + ITEM_GAP / 2 ? 1 : 0;
  const row = Math.floor((y - yoffsets) / (ITEM_HEIGHT + ITEM_GAP));
  const index = row * 2 + column;
  return index < 0 ? 0 : index; // row can be negative if the dragged item is above the first row
};

const positionFromIndex = (index: number, offset: { y: number }) => {
  'worklet';
  const column = index % 2;
  const row = Math.floor(index / 2);
  const position = { x: column * (ITEM_WIDTH + ITEM_GAP), y: row * (ITEM_HEIGHT + ITEM_GAP) + offset.y };
  return position;
};

type Point = { x: number; y: number };
type DraggingState = {
  chainId: ChainId;
  position: Point;
};

function SectionSeparator({
  editing,
  expanded,
  networks,
  sectionsOffsets,
  showExpandButtonAsNetworkChip,
}: {
  editing: SharedValue<boolean>;
  expanded: SharedValue<boolean>;
  networks: SharedValue<Record<Section.pinned | Section.unpinned, ChainId[]>>;
  sectionsOffsets: SharedValue<Record<Section, { y: number }>>;
  showExpandButtonAsNetworkChip: SharedValue<boolean>;
}) {
  const { isDarkMode } = useColorMode();
  const pressed = useSharedValue(false);

  const visible = useDerivedValue(() => {
    return networks.value[Section.unpinned].length > 0 || editing.value;
  });

  const tapExpand = Gesture.Tap()
    .onTouchesDown((e, s) => {
      if (editing.value || !visible.value) return s.fail();
      pressed.value = true;
    })
    .onEnd(() => {
      triggerHaptics('selection');
      expanded.value = !expanded.value;
      pressed.value = false;
    })
    .onFinalize(() => {
      if (pressed.value) pressed.value = false;
    });

  const text = useDerivedValue(() => {
    if (editing.value) return translations.drag_to_rearrange;
    if (showExpandButtonAsNetworkChip.value) return translations.more;
    return expanded.value ? translations.show_less : translations.show_more;
  });

  const unpinnedNetworksLength = useDerivedValue(() => networks.value[Section.unpinned].length.toString());
  const showMoreOrLessIcon = useDerivedValue<string>(() => (expanded.value ? '􀆇' : '􀆈'));

  const showMoreOrLessIconStyle = useAnimatedStyle(() => ({ opacity: editing.value ? 0 : 1 }));
  const showMoreAmountStyle = useAnimatedStyle(() => ({
    opacity: withSpring(expanded.value || editing.value ? 0 : 1, SPRING_CONFIGS.snappierSpringConfig),
    width: expanded.value ? 0 : parseFloat(unpinnedNetworksLength.value) >= 10 ? 30 : 24,
  }));

  const separatorContainerStyles = useAnimatedStyle(() => {
    if (showExpandButtonAsNetworkChip.value) {
      const position = positionFromIndex(networks.value[Section.pinned].length, sectionsOffsets.value[Section.pinned]);
      return {
        backgroundColor: isDarkMode ? globalColors.white10 : globalColors.grey20,
        borderColor: '#F5F8FF05',
        height: visible.value ? ITEM_HEIGHT : 0,
        opacity: visible.value ? 1 : 0,
        transform: [{ translateX: position.x }, { translateY: position.y }],
        width: ITEM_WIDTH,
      };
    }

    return {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      height: visible.value ? SEPARATOR_HEIGHT : 0,
      opacity: visible.value ? 1 : 0,
      transform: [
        { translateY: sectionsOffsets.value[Section.separator].y },
        { scale: withTiming(pressed.value ? 0.925 : 1, TIMING_CONFIGS.buttonPressConfig) },
      ],
      width: '100%',
    };
  });

  return (
    <GestureDetector gesture={tapExpand}>
      <Animated.View style={[sx.sectionSeparatorContainer, separatorContainerStyles]}>
        <Animated.View style={[sx.networkCountBadge, { backgroundColor: isDarkMode ? '#F5F8FF05' : '#1B1D1F0f' }, showMoreAmountStyle]}>
          <AnimatedText align="center" color="labelQuaternary" size="15pt" weight="bold">
            {unpinnedNetworksLength}
          </AnimatedText>
        </Animated.View>
        <AnimatedText align="center" color="labelQuaternary" size="17pt" weight="bold">
          {text}
        </AnimatedText>
        <AnimatedTextIcon color="labelQuaternary" size="13pt" textStyle={showMoreOrLessIconStyle} weight="heavy" width={16}>
          {showMoreOrLessIcon}
        </AnimatedTextIcon>
      </Animated.View>
    </GestureDetector>
  );
}

function EmptyUnpinnedPlaceholder({
  isUnpinnedHidden,
  networks,
  sectionsOffsets,
}: {
  isUnpinnedHidden: SharedValue<boolean>;
  networks: SharedValue<Record<Section.pinned | Section.unpinned, ChainId[]>>;
  sectionsOffsets: SharedValue<Record<Section, { y: number }>>;
}) {
  const { isDarkMode } = useColorMode();
  const animatedStyle = useAnimatedStyle(() => {
    const isVisible = networks.value[Section.unpinned].length === 0 && !isUnpinnedHidden.value;
    return {
      opacity: withSpring(isVisible ? 0.5 : 0, SPRING_CONFIGS.snappierSpringConfig),
      transform: [{ translateY: sectionsOffsets.value[Section.unpinned].y }],
    };
  });

  return (
    <Animated.View
      style={[sx.emptyUnpinnedPlaceholder, { backgroundColor: isDarkMode ? globalColors.white10 : globalColors.grey20 }, animatedStyle]}
    >
      <Text align="center" color="labelQuaternary" size="17pt" style={sx.flex} weight="bold">
        {i18n.t(t.drop_here_to_unpin)}
      </Text>
    </Animated.View>
  );
}

function getInitialNetworksState({
  fillPinnedSection,
  allowedNetworks,
  hasMastheadButton,
}: {
  fillPinnedSection: boolean | undefined;
  allowedNetworks?: ChainId[];
  hasMastheadButton: boolean | undefined;
}): Record<Section.pinned | Section.unpinned, ChainId[]> {
  let initialPinned = networkSwitcherStore.getState().pinnedNetworks;
  const sortedSupportedChainIds = useBackendNetworksStore.getState().getSortedSupportedChainIds();
  let initialUnpinned = sortedSupportedChainIds.filter(chainId => !initialPinned.includes(chainId));

  if (allowedNetworks) {
    initialPinned = initialPinned.filter(chainId => allowedNetworks.includes(chainId));
    initialUnpinned = initialUnpinned.filter(chainId => allowedNetworks.includes(chainId));
  }

  if (fillPinnedSection) {
    const maxPinnedNetworks =
      Math.floor(
        (MAX_HEIGHT - HEADER_HEIGHT - (hasMastheadButton ? MASTHEAD_BUTTON_HEIGHT : 0) - SEPARATOR_HEIGHT) / (ITEM_HEIGHT + ITEM_GAP)
      ) * 2;

    if (initialPinned.length > maxPinnedNetworks) {
      // Move excess networks to unpinned
      const networksToUnpin = initialPinned.slice(maxPinnedNetworks);
      initialUnpinned = [...networksToUnpin, ...initialUnpinned];
      initialPinned = initialPinned.slice(0, maxPinnedNetworks);
    } else {
      // Fill remaining space in pinned section
      const networksToAdd = Math.min(maxPinnedNetworks - initialPinned.length, initialUnpinned.length);
      const networksBeingMoved = initialUnpinned.slice(0, networksToAdd);
      initialUnpinned = initialUnpinned.slice(networksToAdd);
      initialPinned = [...initialPinned, ...networksBeingMoved];
    }
  }

  return {
    [Section.pinned]: initialPinned,
    [Section.unpinned]: initialUnpinned,
  };
}

type NetworksGridProps = NetworkSwitcherProps & {
  canSelect: boolean;
  expanded: SharedValue<boolean>;
  scrollY: SharedValue<number>;
  scrollViewHeight: SharedValue<number>;
  scrollViewContentHeight: SharedValue<number>;
};

function NetworksGrid({
  canSelect,
  canEdit,
  editing,
  expanded,
  selected,
  setSelected,
  allowedNetworks,
  scrollY,
  scrollViewHeight,
  scrollViewContentHeight,
  goBackOnSelect,
  fillPinnedSection,
  canSelectAllNetworks,
  actionButton,
}: NetworksGridProps) {
  const { goBack } = useNavigation();
  const sortedSupportedChainIds = useBackendNetworksStore.getState().getSortedSupportedChainIds();

  const networks = useSharedValue(
    getInitialNetworksState({
      fillPinnedSection,
      allowedNetworks,
      hasMastheadButton: !!actionButton || canSelectAllNetworks,
    })
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    // persists pinned networks when closing the sheet
    // should be the only time this component is unmounted
    return () => {
      if (!canEdit) return;

      if (networks.value[Section.pinned].length > 0) {
        networkSwitcherStore.setState({ pinnedNetworks: networks.value[Section.pinned] });
      } else {
        networkSwitcherStore.setState({ pinnedNetworks: defaultPinnedNetworks });
      }
    };
  }, [networks]);

  const dragging = useSharedValue<DraggingState | null>(null);
  const isUnpinnedHidden = useDerivedValue(() => !expanded.value && !editing.value);

  const showExpandButtonAsNetworkChip = useDerivedValue(() => {
    return !expanded.value && !editing.value && networks.value[Section.pinned].length % 2 !== 0;
  });

  const sectionsOffsets = useDerivedValue(() => {
    const pinnedHeight = Math.ceil(networks.value[Section.pinned].length / 2) * (ITEM_HEIGHT + ITEM_GAP) - ITEM_GAP;
    return {
      [Section.pinned]: { y: 0 },
      [Section.separator]: { y: pinnedHeight },
      [Section.unpinned]: { y: pinnedHeight + (showExpandButtonAsNetworkChip.value ? SEPARATOR_HEIGHT_NETWORK_CHIP : SEPARATOR_HEIGHT) },
    };
  });

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      scrollViewHeight.value = event.nativeEvent.layout.height;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onContentSizeChange = useCallback((width: number, height: number) => {
    scrollViewContentHeight.value = height;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerHeight = useDerivedValue(() => {
    const length = networks.value[Section.unpinned].length;

    const amountOfPinned = networks.value[Section.pinned].length;
    const maxPinnedNetworks =
      Math.floor(
        (MAX_HEIGHT - HEADER_HEIGHT - (!!actionButton || canSelectAllNetworks ? MASTHEAD_BUTTON_HEIGHT : 0) - SEPARATOR_HEIGHT) /
          (ITEM_HEIGHT + ITEM_GAP)
      ) * 2;

    const paddingBottom = 18;
    const unpinnedHeight = isUnpinnedHidden.value
      ? length === 0
        ? fillPinnedSection
          ? amountOfPinned === maxPinnedNetworks
            ? paddingBottom + 10
            : paddingBottom
          : -SEPARATOR_HEIGHT + paddingBottom
        : 0
      : length === 0
        ? ITEM_HEIGHT + paddingBottom
        : Math.ceil((length + (editing.value ? 1 : 0)) / 2) * (ITEM_HEIGHT + ITEM_GAP) - ITEM_GAP + paddingBottom;

    return sectionsOffsets.value[Section.unpinned].y + unpinnedHeight;
  });

  const containerStyle = useAnimatedStyle(() => ({
    height: withSpring(containerHeight.value, SPRING_CONFIGS.springConfig),
  }));

  const onSelectNetwork = useCallback(
    (chainId: ChainId) => {
      'worklet';

      triggerHaptics('selection');
      selected.value = chainId;
      runOnJS(setSelected)(chainId);

      if (goBackOnSelect) {
        runOnJS(goBack)();
      }
    },
    [goBack]
  );

  const dragNetwork = Gesture.Pan()
    .activateAfterLongPress(180)
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
      triggerHaptics('soft');
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
          triggerHaptics('selection');
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
    .enabled(canSelect)
    .onTouchesDown((e, s) => {
      if (editing.value) return s.fail();
    })
    .onEnd(e => {
      const section = e.y > sectionsOffsets.value[Section.unpinned].y ? Section.unpinned : Section.pinned;
      const index = indexFromPosition(e.x, e.y, sectionsOffsets.value[section]);
      const chainId = networks.value[section][index];
      if (!chainId) return;

      onSelectNetwork(chainId);
    });

  const gridGesture = Gesture.Exclusive(dragNetwork, tapNetwork);

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      showsVerticalScrollIndicator={false}
      bounces={true}
      style={{ overflow: 'hidden' }}
      contentContainerStyle={{ overflow: 'hidden' }}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
    >
      <GestureDetector gesture={gridGesture}>
        <Animated.View style={[containerStyle, { marginTop: 14, overflow: 'hidden' }]}>
          {networks.value[Section.pinned].map(chainId => (
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

          <SectionSeparator
            editing={editing}
            expanded={expanded}
            networks={networks}
            sectionsOffsets={sectionsOffsets}
            showExpandButtonAsNetworkChip={showExpandButtonAsNetworkChip}
          />

          <EmptyUnpinnedPlaceholder sectionsOffsets={sectionsOffsets} networks={networks} isUnpinnedHidden={isUnpinnedHidden} />

          {networks.value[Section.unpinned].map(chainId => (
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
    </Animated.ScrollView>
  );
}

type SheetProps = PropsWithChildren<Pick<NetworkSwitcherProps, 'onClose' | 'canEdit' | 'title'>> & {
  editing: SharedValue<boolean>;
  expanded: SharedValue<boolean>;
  scrollY: SharedValue<number>;
  scrollViewHeight: SharedValue<number>;
  scrollViewContentHeight: SharedValue<number>;
};

function Sheet({ children, title, editing, onClose, canEdit, scrollY, scrollViewHeight, scrollViewContentHeight }: SheetProps) {
  const { isDarkMode } = useColorMode();
  const surfacePrimary = useBackgroundColor('surfacePrimary');
  const backgroundColor = isDarkMode ? '#191A1C' : surfacePrimary;
  const separatorSecondary = useForegroundColor('separatorSecondary');

  // make sure the onClose function is called when the sheet unmounts
  useEffect(() => {
    return () => onClose?.();
  }, [onClose]);

  const gradientStyle = useAnimatedStyle(() => {
    const distanceFromBottomOfScrollView = scrollViewContentHeight.value - (scrollY.value + scrollViewHeight.value);
    return {
      opacity: interpolate(distanceFromBottomOfScrollView, [0, 20], [0, 1]),
    };
  });

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
        <Header title={title} canEdit={canEdit} editing={editing} />
        {children}
        <Animated.View
          style={[gradientStyle, { height: FOOTER_HEIGHT, position: 'absolute', bottom: 0, width: SHEET_WIDTH, pointerEvents: 'none' }]}
        >
          <EasingGradient
            endColor={isDarkMode ? '#191A1C' : '#F5F5F5'}
            endOpacity={1}
            startColor={isDarkMode ? '#191A1C' : '#F5F5F5'}
            startOpacity={0}
            style={{ height: '100%', position: 'absolute', width: '100%' }}
          />
        </Animated.View>
      </Box>
      <TapToDismiss />
    </>
  );
}

export function NetworkSelector() {
  const {
    params: {
      onClose = noop,
      selected,
      canSelect = true,
      canEdit = true,
      canSelectAllNetworks = true,
      setSelected,
      allowedNetworks,
      goBackOnSelect = false,
      title = translations.network,
      fillPinnedSection = false,
      actionButton,
    },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.NETWORK_SELECTOR>>();

  const editing = useSharedValue(false);
  const expanded = useSharedValue(false);
  const scrollY = useSharedValue(0);
  const scrollViewHeight = useSharedValue(0);
  const scrollViewContentHeight = useSharedValue(0);
  const selectedNetwork = useSharedValue(typeof selected === 'number' ? selected : selected?.value);

  return (
    <Sheet
      title={title}
      expanded={expanded}
      editing={editing}
      onClose={onClose}
      canEdit={canEdit}
      scrollY={scrollY}
      scrollViewHeight={scrollViewHeight}
      scrollViewContentHeight={scrollViewContentHeight}
    >
      {canEdit && <CustomizeNetworksBanner editing={editing} />}
      {(canSelectAllNetworks || actionButton) && (
        <AllNetworksSection
          canSelect={canSelect}
          editing={editing}
          selected={selectedNetwork}
          setSelected={setSelected}
          goBackOnSelect={goBackOnSelect}
          actionButton={actionButton}
        />
      )}
      <NetworksGrid
        canSelect={canSelect}
        editing={editing}
        expanded={expanded}
        selected={selectedNetwork}
        setSelected={setSelected}
        allowedNetworks={allowedNetworks}
        scrollY={scrollY}
        scrollViewHeight={scrollViewHeight}
        scrollViewContentHeight={scrollViewContentHeight}
        goBackOnSelect={goBackOnSelect}
        canSelectAllNetworks={canSelectAllNetworks}
        actionButton={actionButton}
        fillPinnedSection={fillPinnedSection}
        canEdit={canEdit}
      />
    </Sheet>
  );
}

const sx = StyleSheet.create({
  allNetworksButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: THICK_BORDER_WIDTH,
    flexDirection: 'row',
    height: ITEM_HEIGHT,
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  allNetworksCoinIcons: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 20,
    position: 'absolute',
  },
  allNetworksContainer: {
    gap: 14,
    justifyContent: 'flex-end',
  },
  banner: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: -(BANNER_HEIGHT + 14),
  },
  bannerBlurView: {
    height: BANNER_HEIGHT,
  },
  bannerContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    height: 68,
    marginTop: 68 - BANNER_HEIGHT,
    padding: 16 + 12,
  },
  bannerGradient: {
    alignItems: 'center',
    backgroundColor: '#268FFF14',
    borderColor: '#268FFF0D',
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  editButton: {
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: THICK_BORDER_WIDTH,
    height: 28,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 10 - THICK_BORDER_WIDTH,
    position: 'absolute',
    right: 4,
    top: IS_IOS ? 0 : -14,
  },
  emptyUnpinnedPlaceholder: {
    alignItems: 'center',
    borderColor: '#F5F8FF05',
    borderRadius: 24,
    borderWidth: THICK_BORDER_WIDTH,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 12,
    width: '100%',
  },
  flex: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    height: HEADER_HEIGHT,
    paddingTop: 20,
    width: '100%',
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 28,
    justifyContent: 'center',
  },
  networkCountBadge: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  networkOption: {
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
  overlappingBadge: {
    borderRadius: ALL_NETWORKS_BADGE_SIZE,
    borderWidth: THICKER_BORDER_WIDTH,
    height: ALL_NETWORKS_BADGE_SIZE + THICKER_BORDER_WIDTH * 2,
    marginLeft: -9,
    width: ALL_NETWORKS_BADGE_SIZE + THICKER_BORDER_WIDTH * 2,
  },
  positionAbsolute: {
    position: 'absolute',
  },
  sectionSeparatorContainer: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: THICK_BORDER_WIDTH,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    position: 'absolute',
  },
  sheet: {
    borderCurve: 'continuous',
    borderRadius: 42,
    borderWidth: THICK_BORDER_WIDTH,
    bottom: Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30),
    flex: 1,
    left: 8,
    overflow: 'hidden',
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 8,
    width: SHEET_WIDTH,
    maxHeight: MAX_HEIGHT,
    zIndex: 30000,
  },
  sheetHandle: {
    alignSelf: 'center',
    borderCurve: 'continuous',
    borderRadius: 3,
    height: 5,
    overflow: 'hidden',
    position: 'absolute',
    top: 6,
    width: 36,
  },
});
