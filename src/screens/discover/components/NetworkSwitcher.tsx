import { getChainColorWorklet } from '@/__swaps__/utils/swaps';
import { chainsLabel, SUPPORTED_CHAIN_IDS_ALPHABETICAL } from '@/chains';
import { ChainId } from '@/chains/types';
import { AbsolutePortal } from '@/components/AbsolutePortal';
import { AnimatedBlurView } from '@/components/AnimatedComponents/AnimatedBlurView';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { DesignSystemProvider, globalColors, Separator, Text, useBackgroundColor, useColorMode } from '@/design-system';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { nonceStore } from '@/state/nonces';
import { useTheme } from '@/theme';
import MaskedView from '@react-native-masked-view/masked-view';
import chroma from 'chroma-js';
import { useReducer, useState } from 'react';
import React, { Pressable, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureStateChangeEvent, TapGestureHandlerEventPayload } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  runOnJS,
  SequencedTransition,
  SharedValue,
  SlideInDown,
  SlideOutDown,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as i18n from '@/languages';

const t = i18n.l.network_switcher;

function getMostUsedChains() {
  const noncesByAddress = nonceStore.getState().nonces;

  const summedNoncesByChainId: Record<string, number> = {};
  for (const addressNonces of Object.values(noncesByAddress)) {
    for (const [chainId, { currentNonce }] of Object.entries(addressNonces)) {
      summedNoncesByChainId[chainId] ??= 0;
      summedNoncesByChainId[chainId] += currentNonce || 0;
    }
  }

  return Object.entries(summedNoncesByChainId)
    .sort((a, b) => b[1] - a[1])
    .map(([chainId]) => parseInt(chainId));
}

const initialPinnedNetworks = getMostUsedChains().slice(0, 5);
const useNetworkSwitcherStore = createRainbowStore<{ pinnedNetworks: ChainId[] }>(
  () => ({
    pinnedNetworks: initialPinnedNetworks,
  }),
  {
    storageKey: 'network-switcher',
    version: 0,
  }
);
const setNetworkSwitcherState = (s: { pinnedNetworks: ChainId[] }) => {
  useNetworkSwitcherStore.setState(s);
};

function EditButton({ text, onPress }: { text: string; onPress: VoidFunction }) {
  const blue = useForegroundColor('blue');

  const pressed = useSharedValue<boolean>(false);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
    })
    .onFinalize(() => {
      pressed.value = false;
      runOnJS(onPress)();
    });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 0,
            borderColor: chroma(blue).alpha(0.08).hex(),
            borderWidth: 1.33,
            paddingHorizontal: 10,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
          },
          animatedStyles,
        ]}
      >
        <Text color="blue" size="17pt" weight="bold" style={{ shadowColor: '#268FFF', shadowOpacity: 0.4, shadowRadius: 12 }}>
          {text}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

function ExpandNetworks({
  hiddenNetworksLength,
  isExpanded,
  toggleExpanded,
}: {
  hiddenNetworksLength: number;
  toggleExpanded: (expanded: boolean) => void;
  isExpanded: boolean;
}) {
  const pressed = useSharedValue<boolean>(false);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
    })
    .onFinalize(() => {
      pressed.value = false;
      runOnJS(toggleExpanded)(!isExpanded);
    });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            height: 44,
            marginBottom: isExpanded ? 0 : -16,
          },
          animatedStyles,
        ]}
      >
        {!isExpanded && (
          <View
            style={{
              backgroundColor: '#F5F8FF05',
              height: 24,
              width: 24,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text color="labelQuaternary" weight="bold" size="15pt" align="center">
              {hiddenNetworksLength}
            </Text>
          </View>
        )}
        <Text color="labelTertiary" weight="bold" size="17pt">
          {isExpanded ? i18n.t(t.show_less) : i18n.t(t.show_more)}
        </Text>
        <View style={{ width: 24, justifyContent: 'center' }}>
          <Text color="labelQuaternary" weight="heavy" size="13pt">
            {isExpanded ? '􀆇' : '􀆈'}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function AllNetworksOption({
  selected,
  onPress,
}: {
  selected: boolean;
  onPress?: (e: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
}) {
  const { isDarkMode } = useColorMode();
  const surfacePrimary = useBackgroundColor('surfacePrimary');
  const networkSwitcherBackgroundColor = isDarkMode ? '#191A1C' : surfacePrimary;

  const blue = useForegroundColor('blue');

  const backgroundColor = selected
    ? chroma.scale([networkSwitcherBackgroundColor, blue])(0.16).hex()
    : isDarkMode
      ? globalColors.white10
      : '#F2F3F4';
  const borderColor = selected ? chroma(blue).alpha(0.16).hex() : '#F5F8FF05';

  const pressed = useSharedValue<boolean>(false);

  const tap = Gesture.Tap()
    .onBegin(e => {
      pressed.value = true;
      if (onPress) runOnJS(onPress)(e);
    })
    .onFinalize(() => {
      pressed.value = false;
    })
    .enabled(!!onPress);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }],
  }));

  const overlappingBadge = {
    borderColor: backgroundColor,
    borderWidth: 1.67,
    borderRadius: 16,
    marginLeft: -9,
    width: 16 + 1.67 * 2,
    height: 16 + 1.67 * 2,
  };

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          {
            height: 48,
            flex: 1,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor,
            borderRadius: 24,
            borderWidth: 1.33,
            borderColor,
          },
          animatedStyles,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', marginLeft: 16 }}>
          <ChainImage chainId={ChainId.base} size={16} />
          <ChainImage chainId={ChainId.mainnet} size={16} style={overlappingBadge} />
          <ChainImage chainId={ChainId.optimism} size={16} style={overlappingBadge} />
          <ChainImage chainId={ChainId.arbitrum} size={16} style={overlappingBadge} />
        </View>
        <Text color="label" size="17pt" weight="bold" style={{ textAlign: 'center', flex: 1 }}>
          {i18n.t(t.all_networks)}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

function NetworkOption({
  chainId,
  selected,
  onPress,
  style,
}: {
  chainId: ChainId;
  selected: boolean;
  onPress?: (e: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
  style?: ViewStyle;
}) {
  const name = chainsLabel[chainId];
  if (!name) throw new Error(`<NetworkSwitcher />: No chain name for chainId ${chainId}`);

  const { isDarkMode } = useColorMode();

  const surfacePrimary = useBackgroundColor('surfacePrimary');
  const networkSwitcherBackgroundColor = isDarkMode ? '#191A1C' : surfacePrimary;

  const chainColor = getChainColorWorklet(chainId, true);
  const backgroundColor = selected
    ? chroma.scale([networkSwitcherBackgroundColor, chainColor])(0.16).hex()
    : isDarkMode
      ? globalColors.white10
      : globalColors.grey20;

  const borderColor = selected ? chroma(chainColor).alpha(0.16).hex() : '#F5F8FF05';

  const pressed = useSharedValue<boolean>(false);

  const tap = Gesture.Tap()
    .onBegin(e => {
      pressed.value = true;
      if (onPress) runOnJS(onPress)(e);
    })
    .onFinalize(() => {
      pressed.value = false;
    })
    .enabled(!!onPress);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        layout={LinearTransition.springify().mass(0.4)}
        style={[
          {
            height: 48,
            width: 164.5,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor,
            borderRadius: 24,
            borderWidth: 1.33,
            borderColor,
          },
          animatedStyles,
          style,
        ]}
      >
        <ChainImage chainId={chainId} size={24} />
        <Text color="label" size="17pt" weight="bold" style={{ textAlign: 'center', flex: 1 }}>
          {name}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

type Transform = { x: number; y: number; scale: number };

const ITEM_HEIGHT = 48;
const ITEM_WIDTH = 164.5;
const GAP = 12;
const HALF_GAP = 6;

function DraggingItem({
  chainId,
  selected,
  transform,
}: {
  chainId: ChainId | null;
  transform: SharedValue<Transform | null>;
  selected: boolean;
}) {
  const draggingStyles = useAnimatedStyle(() => {
    if (!transform.value) return { opacity: 0 };
    return {
      opacity: 1,
      transform: [{ scale: transform.value.scale }],
      left: transform.value.x,
      top: transform.value.y,
    };
  });

  return (
    <Animated.View style={[{ zIndex: 2, position: 'absolute', pointerEvents: 'none' }, draggingStyles]}>
      {chainId && <NetworkOption chainId={chainId} selected={selected} />}
    </Animated.View>
  );
}

function NetworksGrid({
  editing,
  selected,
  unselect,
  select,
}: {
  editing: boolean;
  selected: ChainId[];
  unselect: (chainId: ChainId) => void;
  select: (chainId: ChainId) => void;
}) {
  const pinnedNetworks = useSharedValue(useNetworkSwitcherStore(s => s.pinnedNetworks));
  const unpinnedNetworks = useDerivedValue(() =>
    SUPPORTED_CHAIN_IDS_ALPHABETICAL.filter(chainId => !pinnedNetworks.value.includes(chainId))
  );

  const dragging = useSharedValue<ChainId | null>(null);
  const draggingTransform = useSharedValue<Transform | null>(null);
  const dropping = useSharedValue<ChainId | null>(null);
  const droppingTransform = useSharedValue<Transform | null>(null);

  const unpinnedGridY = useSharedValue<number>(NaN);

  // Sync back to store
  useAnimatedReaction(
    () => pinnedNetworks.value,
    (pinnedNetworks, prev) => {
      if (!prev) return; // no need to react on initial value
      runOnJS(setNetworkSwitcherState)({ pinnedNetworks });
    }
  );

  // Force rerender when dragging or dropping changes
  const [, rerender] = useReducer(x => x + 1, 0);
  useAnimatedReaction(
    () => [dropping.value, dragging.value],
    () => {
      console.log('force rerendering');
      runOnJS(rerender)();
    }
  );

  const positionIndex = (x: number, y: number) => {
    'worklet';
    const yOffset = y > unpinnedGridY.value ? unpinnedGridY.value + GAP : 0;
    const column = x > ITEM_WIDTH + HALF_GAP ? 1 : 0;
    const row = Math.floor((y - yOffset) / (ITEM_HEIGHT + HALF_GAP));
    const index = row * 2 + column;
    return index < 0 ? 0 : index; // row can be negative if the dragged item is above the first row
  };

  const indexPosition = (index: number, isUnpinned: boolean) => {
    'worklet';
    const column = index % 2;
    const row = Math.floor(index / 2);
    const position = { x: column * (ITEM_WIDTH + GAP), y: row * (ITEM_HEIGHT + GAP) };
    const yOffset = isUnpinned ? unpinnedGridY.value + GAP : 0;
    return { x: position.x, y: position.y + yOffset };
  };

  const dragNetwork = Gesture.Pan()
    .maxPointers(1)
    .onBegin(e => {
      'worklet';

      const isTargetUnpinned = e.y > unpinnedGridY.value;
      if (!isTargetUnpinned && pinnedNetworks.value.length === 1) return;

      const index = positionIndex(e.x, e.y);
      const position = indexPosition(index, isTargetUnpinned);

      draggingTransform.value = { x: position.x, y: position.y, scale: 1 }; // initial position is the grid slot

      const targetArray = isTargetUnpinned ? unpinnedNetworks.value : pinnedNetworks.value;
      const chainId = targetArray[index];
      dragging.value = chainId;

      draggingTransform.value = withSpring({
        x: e.x - ITEM_WIDTH * 0.5,
        y: e.y - ITEM_HEIGHT * 0.5,
        scale: 1.05,
      }); // animate into the center of the pointer
    })
    .onChange(e => {
      'worklet';
      const chainId = dragging.value;
      if (!chainId) return;

      draggingTransform.modify(item => {
        if (!item) return item;
        item.x = e.x - ITEM_WIDTH * 0.5;
        item.y = e.y - ITEM_HEIGHT * 0.5;
        return item;
      });

      const isDraggingOverUnpinned = e.y > unpinnedGridY.value;

      const currentIndexAtPinned = pinnedNetworks.value.indexOf(chainId);
      const isPinned = currentIndexAtPinned !== -1;

      // We don't reorder unpinned networks
      if (isDraggingOverUnpinned && !isPinned) return;

      // Unpin
      if (isDraggingOverUnpinned && isPinned) {
        pinnedNetworks.modify(networks => {
          networks.splice(currentIndexAtPinned, 1);
          return networks;
        });
        return;
      }

      // Pin
      if (!isDraggingOverUnpinned && !isPinned) {
        pinnedNetworks.modify(networks => {
          networks.push(chainId);
          return networks;
        });
        return;
      }

      // Reorder
      const newIndex = Math.min(positionIndex(e.x, e.y), pinnedNetworks.value.length - 1);
      if (newIndex !== currentIndexAtPinned) {
        pinnedNetworks.modify(networks => {
          networks.splice(currentIndexAtPinned, 1);
          networks.splice(newIndex, 0, chainId);
          return networks;
        });
      }
    })
    .onFinalize(e => {
      'worklet';
      const chainId = dragging.value;
      if (!chainId) return;

      const isDroppingInUnpinned = e.y > unpinnedGridY.value;

      const index = isDroppingInUnpinned
        ? unpinnedNetworks.value.indexOf(chainId)
        : Math.min(positionIndex(e.x, e.y), pinnedNetworks.value.length - 1);

      const { x, y } = indexPosition(index, isDroppingInUnpinned);

      droppingTransform.value = draggingTransform.value;
      droppingTransform.value = withSpring({ y, x, scale: 1 }, { mass: 0.6 }, completed => {
        if (completed) dropping.value = null;
        else droppingTransform.value = { y, x, scale: 1 };
      });
      dropping.value = dragging.value;
      dragging.value = null;
    })
    .enabled(editing);

  useAnimatedReaction(
    () => unpinnedGridY.value,
    (newY, prevY) => {
      // the layout can recalculate after the drop started
      if (!prevY || !droppingTransform.value) return;
      const { x, y } = droppingTransform.value;
      droppingTransform.value = withSpring({ x, y: y + (prevY - newY), scale: 1 }, { mass: 0.6 }, completed => {
        if (completed) dropping.value = null;
      });
    }
  );

  const [isExpanded, setExpanded] = useState(false);

  const toggleSelected = (chainId: ChainId) => {
    if (selected.includes(chainId)) unselect(chainId);
    else select(chainId);
  };

  const pinnedGrid = editing
    ? pinnedNetworks.value
    : [...pinnedNetworks.value, ...unpinnedNetworks.value.filter(chainId => selected.includes(chainId))];

  const unpinnedGrid = editing ? unpinnedNetworks.value : unpinnedNetworks.value.filter(chainId => !selected.includes(chainId));

  return (
    <GestureDetector gesture={dragNetwork}>
      <View style={{ position: 'relative' }}>
        <DraggingItem
          chainId={dropping.value}
          transform={droppingTransform}
          selected={!!dropping.value && selected.includes(dropping.value)}
        />
        <DraggingItem
          chainId={dragging.value}
          transform={draggingTransform}
          selected={!!dragging.value && selected.includes(dragging.value)}
        />

        <Animated.View layout={SequencedTransition} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 12 }}>
          {pinnedGrid.map(chainId =>
            chainId === dragging.value || chainId === dropping.value ? (
              <View key={`placeholder-${chainId}`} style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT }} />
            ) : (
              <NetworkOption
                key={chainId}
                chainId={chainId}
                selected={selected.includes(chainId)}
                onPress={editing ? undefined : () => toggleSelected(chainId)}
              />
            )
          )}
        </Animated.View>

        {editing ? (
          <Animated.View layout={LinearTransition} style={{ height: 44, justifyContent: 'center', alignItems: 'center' }}>
            <Text color="labelQuaternary" weight="bold" size="17pt">
              {i18n.t(t.drag_to_rearrange)}
            </Text>
          </Animated.View>
        ) : (
          <ExpandNetworks hiddenNetworksLength={unpinnedNetworks.value.length} isExpanded={isExpanded} toggleExpanded={setExpanded} />
        )}

        {(editing || isExpanded) && (
          <Animated.View
            onLayout={e => (unpinnedGridY.value = e.nativeEvent.layout.y)}
            layout={SequencedTransition.duration(500)}
            entering={FadeIn.duration(250).delay(125)}
            style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', paddingVertical: 12 }}
          >
            {unpinnedGrid.length === 0 && (
              <View style={{ borderRadius: 20, flex: 1, height: ITEM_HEIGHT }}>
                <Text color="labelQuaternary" size="15pt" weight="semibold" align="center">
                  Drag here to unpin networks
                </Text>
              </View>
            )}
            {unpinnedGrid.map(chainId =>
              chainId === dragging.value || chainId === dropping.value ? (
                <View key={`placeholder-${chainId}`} style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT }} />
              ) : (
                <NetworkOption
                  key={chainId}
                  chainId={chainId}
                  selected={selected.includes(chainId)}
                  onPress={editing ? undefined : () => toggleSelected(chainId)}
                />
              )
            )}
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

const useCustomizeNetworksBanner = createRainbowStore<{
  dismissedAt: number; // timestamp
}>(() => ({ dismissedAt: 0 }), {
  storageKey: 'CustomizeNetworksBanner',
  version: 0,
});
const twoWeeks = 1000 * 60 * 60 * 24 * 7 * 2;
const dismissCustomizeNetworksBanner = () => {
  const { dismissedAt } = useCustomizeNetworksBanner.getState();
  if (Date.now() - dismissedAt < twoWeeks) return;
  useCustomizeNetworksBanner.setState({ dismissedAt: Date.now() });
};

function CustomizeNetworksBanner() {
  const blue = '#268FFF';

  const dismissedAt = useCustomizeNetworksBanner(s => s.dismissedAt);
  const isOpen = Date.now() - dismissedAt > twoWeeks;

  if (!isOpen) return null;

  return (
    <DesignSystemProvider colorMode="light">
      <Animated.View
        entering={FadeIn.duration(300).delay(600)}
        exiting={FadeOutUp.duration(200)}
        style={{
          position: 'absolute',
          top: -(68 + 16),
          left: 0,
          right: 0,
        }}
      >
        <MaskedView
          maskElement={
            <Svg width="100%" height="75" viewBox="0 0 353 75" fill="none">
              <Path
                d="M1.27368 16.2855C0 20.0376 0 24.6917 0 34C0 43.3083 0 47.9624 1.27368 51.7145C3.67205 58.7799 9.22007 64.3279 16.2855 66.7263C20.0376 68 24.6917 68 34 68H303.795C305.065 68 305.7 68 306.306 68.1265C306.844 68.2388 307.364 68.4243 307.851 68.6781C308.401 68.9641 308.892 69.3661 309.874 70.17L313.454 73.0986L313.454 73.0988C314.717 74.1323 315.349 74.6491 316.052 74.8469C316.672 75.0214 317.328 75.0214 317.948 74.8469C318.651 74.6491 319.283 74.1323 320.546 73.0988L320.546 73.0986L324.269 70.0528C325.203 69.2882 325.671 68.9059 326.166 68.6362C326.634 68.3817 327.044 68.2214 327.56 68.0907C328.107 67.9521 328.787 67.911 330.146 67.8287C332.84 67.6657 334.885 67.3475 336.715 66.7263C343.78 64.3279 349.328 58.7799 351.726 51.7145C353 47.9624 353 43.3083 353 34C353 24.6917 353 20.0376 351.726 16.2855C349.328 9.22007 343.78 3.67205 336.715 1.27368C332.962 0 328.308 0 319 0H34C24.6917 0 20.0376 0 16.2855 1.27368C9.22007 3.67205 3.67205 9.22007 1.27368 16.2855Z"
                fill="black"
              />
            </Svg>
          }
        >
          <AnimatedBlurView blurType="xlight" blurAmount={6} style={{ height: 75 }}>
            <View
              style={{
                flexDirection: 'row',
                height: 68,
                flex: 1,
                padding: 16 + 12,
                gap: 12,
                alignItems: 'center',
                marginTop: 68 - 75,
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
                  {/* 
                    is there a way to render a diferent component mid sentence?
                    like i18n.t(t.customize_networks_banner.description, { Edit: <Text... /> })
                  */}
                  Tap the{' '}
                  <Text weight="bold" size="13pt" color={{ custom: blue }}>
                    Edit
                  </Text>{' '}
                  button below to set up
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
}

export function NetworkSelector({ onClose, onSelect, multiple }: { onClose: VoidFunction; onSelect: VoidFunction; multiple?: boolean }) {
  const { isDarkMode } = useTheme();
  const surfacePrimary = useBackgroundColor('surfacePrimary');
  const backgroundColor = isDarkMode ? '#191A1C' : surfacePrimary;
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const fill = useForegroundColor('fill');

  const translationY = useSharedValue<number>(0);

  const swipeToClose = Gesture.Pan()
    .onChange(event => {
      if (event.translationY < 0) return;
      translationY.value = event.translationY;
    })
    .onFinalize(() => {
      if (translationY.value > 120) runOnJS(onClose)();
      else translationY.value = withSpring(0);
    });

  const [isEditing, setEditing] = useState(false);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: translationY.value }],
  }));

  const [selected, setSelected] = useState<ChainId[] | 'all'>([]);
  const unselect = (chainId: ChainId) =>
    setSelected(s => {
      if (s === 'all') return [];
      return s.filter(id => id !== chainId);
    });
  const select = (chainId: ChainId) =>
    setSelected(s => {
      if (s === 'all') return [chainId];
      return multiple ? [...s, chainId] : [chainId];
    });

  return (
    <AbsolutePortal>
      <View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Animated.View
          entering={FadeIn.delay(100)}
          exiting={FadeOut}
          onTouchEnd={onClose}
          style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000B2' }}
        />

        <Animated.View
          layout={LinearTransition.springify().mass(0.5)}
          entering={SlideInDown.duration(200).springify().mass(0.4)}
          exiting={SlideOutDown.duration(200)}
          style={[
            {
              position: 'absolute',
              bottom: 32,
              left: 8,
              right: 8,
              borderRadius: 42,
              backgroundColor,
              borderColor: separatorSecondary,
              borderWidth: 1.33,
              paddingHorizontal: 16,
              paddingBottom: 32,
              gap: 14,
            },
            animatedStyles,
          ]}
        >
          <CustomizeNetworksBanner />
          <GestureDetector gesture={swipeToClose}>
            <View style={{ height: 66, borderBottomWidth: 1, borderBottomColor: separatorTertiary, paddingTop: 20 }}>
              <View style={{ position: 'absolute', left: 0, right: 0, top: 6 }}>
                <View style={{ height: 5, width: 36, marginHorizontal: 'auto', borderRadius: 3, backgroundColor: fill }} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 28 }}>
                <Text color="label" size="20pt" weight="heavy">
                  {isEditing ? i18n.t(t.edit) : i18n.t(t.networks)}
                </Text>

                <EditButton
                  text={isEditing ? i18n.t(i18n.l.done) : i18n.t(t.edit)}
                  onPress={() => {
                    dismissCustomizeNetworksBanner();
                    setEditing(s => !s);
                  }}
                />
              </View>
            </View>
          </GestureDetector>

          {multiple && !isEditing && (
            <>
              <AllNetworksOption selected={selected === 'all'} onPress={() => setSelected('all')} />
              <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
            </>
          )}

          <NetworksGrid editing={isEditing} select={select} unselect={unselect} selected={selected !== 'all' ? selected : []} />
        </Animated.View>
      </View>
    </AbsolutePortal>
  );
}
