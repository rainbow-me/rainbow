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
import { memo, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, TextInput, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import Animated, {
  DerivedValue,
  Easing,
  FadeIn,
  FadeOutUp,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
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
import { Navigation, useNavigation } from '@/navigation';
import { UserAssetFilter } from '@/__swaps__/types/assets';
import Routes from '@/navigation/routesNames';
import { SEARCH_BAR_HEIGHT, SearchBar } from './components/SearchBar';
import { KeyboardProvider, KeyboardStickyView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Chain } from 'viem/chains';

type RouteParams = RouteProp<RootStackParamList, 'NetworkSelector'>['params'];

type SelectedNetwork = SharedValue<ChainId | UserAssetFilter | undefined>;
type NetworkSwitcherProps = RouteParams & {
  editing: SharedValue<boolean>;
  selected: SelectedNetwork;
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
const SECTION_GAP = 14;
const ITEM_WIDTH = (DEVICE_WIDTH - SHEET_INNER_PADDING * 2 - SHEET_OUTER_INSET * 2 - ITEM_GAP) / 2;
const ITEM_HEIGHT = 48;
const MASTHEAD_BUTTON_HEIGHT = ITEM_HEIGHT + SECTION_GAP * 2;
const SEPARATOR_HEIGHT = 68;
const SEPARATOR_HEIGHT_NETWORK_CHIP = 18;
const SHEET_WIDTH = deviceUtils.dimensions.width - 16;
const ALL_NETWORKS_BADGE_SIZE = 16;
const THICKER_BORDER_WIDTH = 5 / 3;
const PANEL_BOTTOM_OFFSET = Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30);
const MAX_NETWORK_LIST_HEIGHT = MAX_HEIGHT - HEADER_HEIGHT;
const SEARCH_BAR_CLEARANCE = SEARCH_BAR_HEIGHT + SHEET_INNER_PADDING + 18;

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
  edit: i18n.t(i18n.l.button.edit),
  done: i18n.t(i18n.l.button.done),
  cancel: i18n.t(i18n.l.button.cancel),
  more: i18n.t(i18n.l.button.more),
  network: i18n.t(t.network),
  show_more: i18n.t(t.show_more),
  show_less: i18n.t(t.show_less),
  drag_to_rearrange: i18n.t(t.drag_to_rearrange),
};

function HeaderActionButton({ onPress, text }: { onPress: () => void; text: SharedValue<string> | DerivedValue<string> }) {
  const blue = useForegroundColor('blue');
  const borderColor = useMemo(() => chroma(blue).alpha(0.08).hex(), [blue]);

  return (
    <ButtonPressAnimation onPress={onPress} style={[sx.editButton, { borderColor }]}>
      <TextShadow blur={12} shadowOpacity={0.4}>
        <AnimatedText align="center" color="blue" size="17pt" weight="bold">
          {text}
        </AnimatedText>
      </TextShadow>
    </ButtonPressAnimation>
  );
}

type HeaderProps = Pick<NetworkSwitcherProps, 'title' | 'canEdit' | 'editing'> & {
  isSearching: boolean;
  onPressActionButton: () => void;
};

function Header({ title, canEdit, editing, isSearching, onPressActionButton: onActionButtonPressed }: HeaderProps) {
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const fill = useForegroundColor('fill');

  const titleValue = useDerivedValue(() => {
    return editing.value ? translations.edit : title;
  });
  const actionButtonText = useDerivedValue(() => {
    if (isSearching) return translations.cancel;
    return editing.value ? translations.done : translations.edit;
  });
  const shouldShowActionButton = canEdit || isSearching;

  return (
    <View style={[sx.headerContainer, { borderBottomColor: separatorTertiary }]}>
      <View style={[sx.sheetHandle, { backgroundColor: fill }]} />

      <View style={sx.headerContent}>
        <AnimatedText align="center" color="label" size="20pt" style={{ width: '100%' }} weight="heavy">
          {titleValue}
        </AnimatedText>

        {shouldShowActionButton && <HeaderActionButton onPress={onActionButtonPressed} text={actionButtonText} />}
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

function NetworkOption({ chainId, selected }: { chainId: ChainId; selected: SelectedNetwork }) {
  const { isDarkMode } = useColorMode();
  const chainColor = useBackendNetworksStore.getState().getColorsForChainId(chainId, isDarkMode);
  const chainName = useBackendNetworksStore.getState().getChainsLabel()[chainId];
  const isSelected = useDerivedValue(() => selected.value === chainId);
  const { animatedStyle } = useNetworkOptionStyle(isSelected, chainColor);

  return (
    <Animated.View style={[sx.networkOption, animatedStyle]}>
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
  chains: Chain[];
  onSelectNetwork: (chainId: ChainId) => void;
};

function NetworksGrid({
  canSelect,
  canEdit,
  editing,
  expanded,
  selected,
  chains,
  fillPinnedSection,
  canSelectAllNetworks,
  actionButton,
  onSelectNetwork,
}: NetworksGridProps) {
  const hasMastheadButton = !!actionButton || canSelectAllNetworks;
  const maxListHeight = useMemo(() => {
    if (hasMastheadButton) {
      return MAX_NETWORK_LIST_HEIGHT - MASTHEAD_BUTTON_HEIGHT;
    }
    return MAX_NETWORK_LIST_HEIGHT;
  }, [hasMastheadButton]);

  const chainIds = useMemo(() => chains.map(chain => chain.id), [chains]);
  const networks = useSharedValue(
    getInitialNetworksState({
      fillPinnedSection,
      allowedNetworks: chainIds,
      hasMastheadButton,
    })
  );

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

  const paddingBottom = useDerivedValue(() => {
    return expanded.value ? SEARCH_BAR_CLEARANCE : SHEET_INNER_PADDING;
  });

  const containerHeight = useDerivedValue(() => {
    const length = networks.value[Section.unpinned].length;

    const amountOfPinned = networks.value[Section.pinned].length;
    const maxPinnedNetworks =
      Math.floor(
        (MAX_HEIGHT - HEADER_HEIGHT - (!!actionButton || canSelectAllNetworks ? MASTHEAD_BUTTON_HEIGHT : 0) - SEPARATOR_HEIGHT) /
          (ITEM_HEIGHT + ITEM_GAP)
      ) * 2;

    const paddingBottomValue = paddingBottom.value;
    const unpinnedHeight = isUnpinnedHidden.value
      ? length === 0
        ? fillPinnedSection
          ? amountOfPinned === maxPinnedNetworks
            ? paddingBottomValue + 10
            : paddingBottomValue
          : -SEPARATOR_HEIGHT + paddingBottomValue
        : 0
      : length === 0
        ? ITEM_HEIGHT + paddingBottomValue
        : Math.ceil((length + (editing.value ? 1 : 0)) / 2) * (ITEM_HEIGHT + ITEM_GAP) - ITEM_GAP + paddingBottomValue;

    return sectionsOffsets.value[Section.unpinned].y + unpinnedHeight;
  });

  const containerStyle = useAnimatedStyle(() => ({
    // TODO: When this animates to a value greater than maxListHeight, the animation is not smooth.
    height: withSpring(containerHeight.value, SPRING_CONFIGS.springConfig),
  }));

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
          networks[Section.unpinned] = chainIds.filter(chainId => !networks[Section.pinned].includes(chainId));
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
    <ScrollView showsVerticalScrollIndicator={false} bounces={true} style={[{ maxHeight: maxListHeight }]}>
      <GestureDetector gesture={gridGesture}>
        <Animated.View style={[{ marginTop: SECTION_GAP, overflow: 'hidden' }, containerStyle]}>
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
    </ScrollView>
  );
}

type NetworkSearchGridProps = {
  selected: SelectedNetwork;
  chains: Chain[];
  onSelectNetwork: (chainId: ChainId) => void;
};

const NetworkSearchGrid = memo(function NetworkSearchGrid({ selected, chains, onSelectNetwork }: NetworkSearchGridProps) {
  const searchQuery = networkSwitcherStore(state => state.searchQuery);
  const pinnedNetworks = networkSwitcherStore.getState().pinnedNetworks;

  const chainIds = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (query.length > 0) {
      return chains
        .filter(chain => chain.name.toLowerCase().includes(query))
        .sort((a, b) => {
          const aStartsWith = a.name.toLowerCase().startsWith(query);
          const bStartsWith = b.name.toLowerCase().startsWith(query);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return 0;
        })
        .map(chain => chain.id);
    } else {
      return chains
        .sort((a, b) => {
          const aIsPinned = pinnedNetworks.includes(a.id);
          const bIsPinned = pinnedNetworks.includes(b.id);

          if (aIsPinned && !bIsPinned) return -1;
          if (!aIsPinned && bIsPinned) return 1;

          if (aIsPinned && bIsPinned) {
            return pinnedNetworks.indexOf(a.id) - pinnedNetworks.indexOf(b.id);
          }
          return 0;
        })
        .map(chain => chain.id);
    }
  }, [chains, pinnedNetworks, searchQuery]);

  return (
    <KeyboardAwareScrollView
      keyboardDismissMode="interactive"
      style={{ height: MAX_HEIGHT - HEADER_HEIGHT }}
      showsVerticalScrollIndicator={false}
    >
      <Box flexDirection="row" flexWrap="wrap" gap={ITEM_GAP} paddingTop={{ custom: 14 }} paddingBottom={{ custom: SEARCH_BAR_CLEARANCE }}>
        {chainIds.map(chainId => (
          <GestureHandlerButton
            key={chainId}
            hapticTrigger="tap-end"
            onPressWorklet={() => {
              'worklet';
              onSelectNetwork(chainId);
            }}
          >
            <NetworkOption chainId={chainId} selected={selected} />
          </GestureHandlerButton>
        ))}
      </Box>
    </KeyboardAwareScrollView>
  );
});

type SheetProps = PropsWithChildren<Pick<NetworkSwitcherProps, 'onClose'>> & {
  expanded: SharedValue<boolean>;
};

function Sheet({ children, onClose, expanded }: SheetProps) {
  const { isDarkMode } = useColorMode();
  const surfacePrimary = useBackgroundColor('surfacePrimary');
  const backgroundColor = isDarkMode ? '#191A1C' : surfacePrimary;
  const separatorSecondary = useForegroundColor('separatorSecondary');

  // make sure the onClose function is called when the sheet unmounts
  useEffect(() => {
    return () => onClose?.();
  }, [onClose]);

  const easingGradientStyle = useAnimatedStyle(() => {
    return {
      opacity: expanded.value ? 1 : 0,
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
        <KeyboardProvider>
          {children}
          <Animated.View
            style={[
              easingGradientStyle,
              { position: 'absolute', bottom: 0, height: FOOTER_HEIGHT, width: SHEET_WIDTH, pointerEvents: 'none' },
            ]}
          >
            <EasingGradient
              endColor={backgroundColor}
              endOpacity={1}
              startColor={backgroundColor}
              startOpacity={0}
              style={{ height: '100%', width: '100%' }}
            />
          </Animated.View>
        </KeyboardProvider>
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
  const selectedNetwork = useSharedValue(typeof selected === 'number' ? selected : selected?.value);
  const isSearchFocused = useSharedValue(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchBarInputRef = useRef<TextInput>(null);

  const chains = useMemo(() => {
    const allSupportedChains = useBackendNetworksStore.getState().getSupportedChains();
    return allowedNetworks ? allSupportedChains.filter(chain => allowedNetworks.includes(chain.id)) : allSupportedChains;
  }, [allowedNetworks]);

  const searchBarStyle = useAnimatedStyle(() => {
    const isVisible = expanded.value && !editing.value;
    return {
      display: isVisible ? 'flex' : 'none',
    };
  });

  const onSelectNetwork = useCallback(
    (chainId: ChainId) => {
      'worklet';

      triggerHaptics('selection');
      selectedNetwork.value = chainId;
      runOnJS(setSelected)(chainId);

      if (goBackOnSelect) {
        runOnJS(Navigation.goBack)();
      }
    },
    [goBackOnSelect, selectedNetwork, setSelected]
  );

  const onPressHeaderActionButton = useCallback(() => {
    if (isSearching) {
      setIsSearching(false);
      searchBarInputRef.current?.blur();
      searchBarInputRef.current?.clear();
      networkSwitcherStore.setState({ searchQuery: '' });
    } else {
      editing.value = !editing.value;
    }
  }, [isSearching, editing]);

  const onBlurSearchBar = useCallback(() => {
    isSearchFocused.value = false;
  }, [isSearchFocused]);

  const onFocusSearchBar = useCallback(() => {
    isSearchFocused.value = true;
    setIsSearching(true);
  }, [isSearchFocused]);

  const onCloseSheet = useCallback(() => {
    onClose?.();
    searchBarInputRef.current?.blur();
    searchBarInputRef.current?.clear();
    networkSwitcherStore.setState({ searchQuery: '' });
  }, [onClose]);

  return (
    <Sheet onClose={onCloseSheet} expanded={expanded}>
      <Header onPressActionButton={onPressHeaderActionButton} title={title} canEdit={canEdit} editing={editing} isSearching={isSearching} />
      {!isSearching && (
        <>
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
            chains={chains}
            goBackOnSelect={goBackOnSelect}
            canSelectAllNetworks={canSelectAllNetworks}
            actionButton={actionButton}
            fillPinnedSection={fillPinnedSection}
            canEdit={canEdit}
            onSelectNetwork={onSelectNetwork}
          />
        </>
      )}
      {isSearching && <NetworkSearchGrid selected={selectedNetwork} chains={chains} onSelectNetwork={onSelectNetwork} />}
      <Animated.View style={[sx.searchBar, searchBarStyle]}>
        <KeyboardStickyView offset={{ opened: PANEL_BOTTOM_OFFSET, closed: 0 }}>
          <SearchBar onFocus={onFocusSearchBar} onBlur={onBlurSearchBar} inputRef={searchBarInputRef} />
        </KeyboardStickyView>
      </Animated.View>
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
    gap: SECTION_GAP,
    justifyContent: 'flex-end',
  },
  banner: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: -(BANNER_HEIGHT + SECTION_GAP),
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
    bottom: PANEL_BOTTOM_OFFSET,
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
  searchBar: {
    bottom: SHEET_INNER_PADDING,
    width: '100%',
    alignSelf: 'center',
    position: 'absolute',
    zIndex: 2,
  },
});
