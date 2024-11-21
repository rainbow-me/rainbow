import { getChainColorWorklet } from '@/__swaps__/utils/swaps';
import { chainsLabel, SUPPORTED_CHAIN_IDS_ALPHABETICAL } from '@/chains';
import { ChainId } from '@/chains/types';
import { AbsolutePortal } from '@/components/AbsolutePortal';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { globalColors, Text, useBackgroundColor, useColorMode } from '@/design-system';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import hiddenTokens from '@/redux/hiddenTokens';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { nonceStore } from '@/state/nonces';

import chroma from 'chroma-js';
import { useReducer, useState } from 'react';
import React, { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureStateChangeEvent, TapGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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
const useNetworkSwitcherStore = createRainbowStore<{ pinnedNetworks: ChainId[]; unpinnedNetworks: ChainId[] }>(
  (set, get) => ({
    pinnedNetworks: initialPinnedNetworks,
    unpinnedNetworks: SUPPORTED_CHAIN_IDS_ALPHABETICAL.filter(chainId => !initialPinnedNetworks.includes(chainId)),
  })
  // {
  //   storageKey: 'network-switcher',
  //   version: 1,
  // }
);
const setNetworkSwitcherState = (s: { pinnedNetworks: ChainId[]; unpinnedNetworks: ChainId[] }) => {
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

function NetworkOption({
  chainId,
  selected,
  onPress,
}: {
  chainId: ChainId;
  selected: boolean;
  onPress?: (e: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
}) {
  const name = chainsLabel[chainId];
  if (!name) throw new Error(`No chain name for chainId ${chainId}`);

  const { isDarkMode } = useColorMode();
  const surfaceSecondary = useBackgroundColor('fillSecondary');
  const chainColor = chroma(getChainColorWorklet(chainId, true)).alpha(0.16).hex();
  const backgroundColor = selected ? chainColor : isDarkMode ? globalColors.white10 : globalColors.grey20;

  const borderColor = selected ? chainColor : '#F5F8FF05';

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
          {isExpanded ? 'Show Less' : 'More Networks'}
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

type Transform = { x: number; y: number; scale: number };

const ITEM_HEIGHT = 48;
const ITEM_WIDTH = 164.5;
const GAP = 12;
const HALF_GAP = 6;

const styles = StyleSheet.create({ draggingItem: { zIndex: 2, position: 'absolute', height: ITEM_HEIGHT, width: ITEM_WIDTH } });

/*

  - what to do if user pins all networks (where to drag to unpin)
  - how to display if user selects a network that is in the "more networks" (hidden)

 */

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
  const networks = useSharedValue(useNetworkSwitcherStore());
  const pinnedNetworks = useDerivedValue(() => networks.value.pinnedNetworks);
  const unpinnedNetworks = useDerivedValue(() => networks.value.unpinnedNetworks);

  const dragging = useSharedValue<ChainId | null>(null);
  const draggingTransform = useSharedValue<Transform | null>(null);
  const dropping = useSharedValue<ChainId | null>(null);
  const droppingTransform = useSharedValue<Transform | null>(null);

  const unpinnedGridY = useSharedValue<number>(NaN);

  // Sync back to store
  useAnimatedReaction(
    () => networks.value,
    current => runOnJS(setNetworkSwitcherState)(current)
  );

  // Force rerender when dragging or dropping changes
  const [, rerender] = useReducer(x => x + 1, 0);
  useAnimatedReaction(
    () => [dropping.value, dragging.value],
    () => runOnJS(rerender)()
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
      if (isTargetUnpinned && pinnedNetworks.value.length === 1) return;

      const index = positionIndex(e.x, e.y);
      const position = indexPosition(index, isTargetUnpinned);

      draggingTransform.value = { x: position.x, y: position.y, scale: 1 }; // initial position is the grid slot
      draggingTransform.value = withSpring({ x: e.x - ITEM_WIDTH * 0.5, y: e.y - ITEM_HEIGHT * 0.5, scale: 1.05 }); // animate into the center of the pointer

      const targetArray = isTargetUnpinned ? unpinnedNetworks.value : pinnedNetworks.value;
      const chainId = targetArray[index];
      dragging.value = chainId;
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

      const targetArrayKey = isDraggingOverUnpinned ? 'unpinnedNetworks' : 'pinnedNetworks';
      const otherArrayKey = isDraggingOverUnpinned ? 'pinnedNetworks' : 'unpinnedNetworks';

      const targetArray = networks.value[targetArrayKey];
      const targetIndex = Math.min(positionIndex(e.x, e.y), targetArray.length - 1);
      const indexInTarget = targetArray.indexOf(chainId);

      if (indexInTarget === -1) {
        networks.modify(v => {
          // Pin/Unpin
          v[otherArrayKey] = v[otherArrayKey].filter(id => id !== chainId);
          v[targetArrayKey].splice(targetIndex, 0, chainId);
          return v;
        });
      } else if (indexInTarget !== targetIndex) {
        // Reorder
        networks.modify(v => {
          const [movedChainId] = v[targetArrayKey].splice(indexInTarget, 1);
          v[targetArrayKey].splice(targetIndex, 0, movedChainId);
          return v;
        });
      }
    })
    .onFinalize(e => {
      'worklet';
      if (!dragging.value) return;

      const isDroppingInUnpinned = e.y > unpinnedGridY.value;
      const targetArray = isDroppingInUnpinned ? pinnedNetworks.value : unpinnedNetworks.value;

      const index = Math.min(positionIndex(e.x, e.y), targetArray.length - 1);
      const { x, y } = indexPosition(index, isDroppingInUnpinned);

      droppingTransform.value = draggingTransform.value;
      droppingTransform.value = withSpring({ y, x, scale: 1 }, { mass: 0.6 }, completed => {
        if (completed) dropping.value = null;
      });
      dropping.value = dragging.value;
      dragging.value = null;
    })
    .enabled(editing);

  useAnimatedReaction(
    () => unpinnedGridY.value,
    (newY, prevY) => {
      // the layout can recalculate after the drop started
      if (!prevY || !droppingTransform.value || droppingTransform.value.y < prevY) return;
      const { x, y, scale } = droppingTransform.value;
      droppingTransform.value = withSpring({ x, y: y + (prevY - newY), scale }, { mass: 0.6 }, completed => {
        if (completed) dropping.value = null;
      });
    }
  );

  const draggingStyles = useAnimatedStyle(() => {
    if (!draggingTransform.value) return {};
    return {
      transform: [{ scale: draggingTransform.value.scale }],
      left: draggingTransform.value.x,
      top: draggingTransform.value.y,
    };
  });

  const droppingStyles = useAnimatedStyle(() => {
    if (!droppingTransform.value) return {};
    return {
      transform: [{ scale: droppingTransform.value.scale }],
      left: droppingTransform.value.x,
      top: droppingTransform.value.y,
    };
  });

  const [isExpanded, setExpanded] = useState(false);

  const toggleSelected = (chainId: ChainId) => {
    if (selected.includes(chainId)) unselect(chainId);
    else select(chainId);
  };

  // const mainGridNetworks = editing
  //   ? pinnedNetworks.value
  //   : [...pinnedNetworks.value, ...unpinnedNetworks.value.filter(chainId => selected.includes(chainId))];

  return (
    <GestureDetector gesture={dragNetwork}>
      <View style={{ position: 'relative' }}>
        {!!dropping.value && (
          <Animated.View style={[styles.draggingItem, droppingStyles]}>
            <NetworkOption chainId={dropping.value} selected={selected.includes(dropping.value)} />
          </Animated.View>
        )}

        {!!dragging.value && (
          <Animated.View style={[styles.draggingItem, draggingStyles]}>
            <NetworkOption chainId={dragging.value} selected={selected.includes(dragging.value)} />
          </Animated.View>
        )}

        <Animated.View
          layout={LinearTransition.springify().mass(0.4)}
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 12 }}
        >
          {pinnedNetworks.value.map(chainId =>
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
              Drag to Rearrange
            </Text>
          </Animated.View>
        ) : (
          <ExpandNetworks hiddenNetworksLength={unpinnedNetworks.value.length} isExpanded={isExpanded} toggleExpanded={setExpanded} />
        )}

        {(editing || isExpanded) && (
          <Animated.View
            onLayout={e => (unpinnedGridY.value = e.nativeEvent.layout.y)}
            layout={LinearTransition}
            entering={FadeIn.duration(250).delay(125)}
            exiting={FadeOut.duration(50)}
            style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', paddingVertical: 12 }}
          >
            {unpinnedNetworks.value.length === 0 && (
              <View style={{ borderRadius: 20, flex: 1, height: ITEM_HEIGHT }}>
                <Text color="labelQuaternary" size="15pt" weight="semibold" align="center">
                  Drag here to unpin networks
                </Text>
              </View>
            )}
            {unpinnedNetworks.value.map(chainId =>
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

export function NetworkSelector({ onClose, onSelect, multiple }: { onClose: VoidFunction; onSelect: VoidFunction; multiple?: boolean }) {
  const backgroundColor = '#191A1C';
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

  const [selected, setSelected] = useState<ChainId[]>([]);
  const unselect = (chainId: ChainId) => setSelected(s => s.filter(id => id !== chainId));
  const select = (chainId: ChainId) => setSelected(s => (multiple ? [...s, chainId] : [chainId]));

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
          <GestureDetector gesture={swipeToClose}>
            <View style={{ height: 66, borderBottomWidth: 1, borderBottomColor: separatorTertiary, paddingTop: 20 }}>
              <View style={{ position: 'absolute', left: 0, right: 0, top: 6 }}>
                <View style={{ height: 5, width: 36, marginHorizontal: 'auto', borderRadius: 3, backgroundColor: fill }} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 28 }}>
                <Text color="label" size="20pt" weight="heavy">
                  {isEditing ? 'Edit' : 'Network'}
                </Text>

                <EditButton text={isEditing ? 'Done' : 'Edit'} onPress={() => setEditing(s => !s)} />
              </View>
            </View>
          </GestureDetector>

          <NetworksGrid editing={isEditing} select={select} unselect={unselect} selected={selected} />
        </Animated.View>
      </View>
    </AbsolutePortal>
  );
}
