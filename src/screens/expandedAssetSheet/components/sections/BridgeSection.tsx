import React, { memo } from 'react';
import { AccentColorProvider, Bleed, Box, Cover, IconContainer, Separator, Text, TextShadow } from '@/design-system';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ButtonPressAnimation } from '@/components/animations';
import { View } from 'react-native';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

// Constants for layout
const GRID_GAP = 9;
const BUTTON_HEIGHT = 36;
const BUTTON_BORDER_RADIUS = 20;
const BUTTON_BORDER_WIDTH = 1.33;
const CHAIN_ICON_SIZE = 20;
const DIVIDER_OFFSET = 5.5;

// Grid layout constants
const GRID_ITEM_BASIS = '40%';
const GRID_ITEM_MAX_WIDTH = '50%';
const EXPANDED_CHAINS_LIMIT = 6;

// Animation constants
const ANIMATION_CONFIG = SPRING_CONFIGS.snappySpringConfig;
const ARBITRARILY_LARGE_MAX_HEIGHT = 1000;

const AnimatedBox = Animated.createAnimatedComponent(Box);

function ToggleExpansionButton({ isExpanded, mode }: { isExpanded: SharedValue<boolean>; mode: 'expand' | 'collapse' }) {
  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <GestureHandlerButton
      onPressWorklet={() => {
        'worklet';
        isExpanded.value = mode === 'expand';
      }}
    >
      <Box
        paddingLeft="8px"
        paddingRight="12px"
        height={{ custom: BUTTON_HEIGHT }}
        borderRadius={BUTTON_BORDER_RADIUS}
        flexDirection="row"
        alignItems="center"
        style={{ backgroundColor: accentColors.opacity3, borderColor: accentColors.opacity2, borderWidth: BUTTON_BORDER_WIDTH }}
      >
        <Bleed vertical="4px">
          <Box
            width={{ custom: CHAIN_ICON_SIZE }}
            height={{ custom: CHAIN_ICON_SIZE }}
            borderRadius={40}
            style={{ backgroundColor: accentColors.opacity6 }}
            alignItems="center"
            justifyContent="center"
          >
            <IconContainer height={8} width={16}>
              <Text weight="black" align="center" size="11pt" color="labelQuaternary">
                {mode === 'expand' ? '􀆈' : '􀆇'}
              </Text>
            </IconContainer>
          </Box>
        </Bleed>
        <Box flexGrow={1}>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text weight="bold" size="17pt" align="center" color="labelTertiary">
              {mode === 'expand' ? 'More' : 'Less'}
            </Text>
          </TextShadow>
        </Box>
      </Box>
    </GestureHandlerButton>
  );
}

function Placeholder() {
  const { accentColors } = useExpandedAssetSheetContext();
  return (
    <Box
      height={{ custom: BUTTON_HEIGHT }}
      borderRadius={BUTTON_BORDER_RADIUS}
      style={{ backgroundColor: accentColors.opacity2, borderColor: accentColors.opacity1, borderWidth: BUTTON_BORDER_WIDTH }}
    />
  );
}

function BridgeButton({ chainId }: { chainId: ChainId }) {
  const { navigate } = useNavigation();
  const { accentColors } = useExpandedAssetSheetContext();
  const chainsLabels = useBackendNetworksStore.getState().getChainsLabel();

  return (
    // TODO: Add nav params after user assets pr is merged in
    <ButtonPressAnimation onPress={() => navigate(Routes.SWAP)}>
      <Box
        paddingRight="12px"
        paddingLeft="8px"
        height={{ custom: BUTTON_HEIGHT }}
        borderRadius={BUTTON_BORDER_RADIUS}
        flexDirection="row"
        alignItems="center"
        style={{ backgroundColor: accentColors.opacity12, borderColor: accentColors.opacity6, borderWidth: BUTTON_BORDER_WIDTH }}
      >
        <Bleed vertical="4px">
          <ChainImage chainId={chainId} size={CHAIN_ICON_SIZE} />
          <Cover>
            <AccentColorProvider color={accentColors.opacity6}>
              <Box
                width={{ custom: CHAIN_ICON_SIZE }}
                height={{ custom: CHAIN_ICON_SIZE }}
                borderRadius={40}
                background="accent"
                alignItems="center"
                justifyContent="center"
                shadow="30px"
              >
                <IconContainer height={8} width={16}>
                  <Text weight="black" align="center" size="11pt" color="labelQuaternary">
                    􀉣
                  </Text>
                </IconContainer>
              </Box>
            </AccentColorProvider>
          </Cover>
        </Bleed>
        <Box flexGrow={1}>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text weight="bold" size="17pt" align="center" color="accent">
              {chainsLabels[chainId]}
            </Text>
          </TextShadow>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
}

function VerticalDivider() {
  return (
    <View style={{ position: 'absolute', right: -DIVIDER_OFFSET, justifyContent: 'center', height: '100%' }}>
      <View style={{ height: 20 }}>
        <Separator color="separatorTertiary" direction="vertical" />
      </View>
    </View>
  );
}

function HorizontalDivider() {
  return (
    <View style={{ position: 'absolute', bottom: -DIVIDER_OFFSET, width: '100%', paddingHorizontal: 8 }}>
      <Separator color="separatorTertiary" direction="horizontal" />
    </View>
  );
}

export const BridgeSection = memo(function BridgeSection() {
  const { asset } = useExpandedAssetSheetContext();
  const isExpanded = useSharedValue(false);
  const availableChains = useUserAssetsStore(state =>
    state.getBalanceSortedChainList().filter(chainId => chainId in asset.networks && chainId !== asset.chainId)
  );

  const totalChains = availableChains.length;
  const numInitiallyVisibleChains = totalChains === EXPANDED_CHAINS_LIMIT ? EXPANDED_CHAINS_LIMIT : EXPANDED_CHAINS_LIMIT - 1;
  const hasExpandableContent = totalChains > EXPANDED_CHAINS_LIMIT;

  const initiallyVisibleChains =
    totalChains === EXPANDED_CHAINS_LIMIT ? availableChains : availableChains.slice(0, numInitiallyVisibleChains);
  const firstExpandedChain = availableChains[EXPANDED_CHAINS_LIMIT - 1];
  const remainingExpandedChains = availableChains.slice(EXPANDED_CHAINS_LIMIT);

  const contentStyle = useAnimatedStyle(() => ({
    maxHeight: withSpring(isExpanded.value ? ARBITRARILY_LARGE_MAX_HEIGHT : 0, ANIMATION_CONFIG),
    opacity: withSpring(isExpanded.value ? 1 : 0, ANIMATION_CONFIG),
  }));

  const moreButtonStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isExpanded.value ? 0 : 1, ANIMATION_CONFIG),
    transform: [{ scale: withSpring(isExpanded.value ? 0.9 : 1, ANIMATION_CONFIG) }],
    pointerEvents: isExpanded.value ? 'none' : 'auto',
  }));

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isExpanded.value ? 1 : 0, ANIMATION_CONFIG),
    pointerEvents: isExpanded.value ? 'auto' : 'none',
  }));

  return (
    <Box>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
        {initiallyVisibleChains.map((chainId, index) => {
          const isLastVisibleRow = index < initiallyVisibleChains.length - (initiallyVisibleChains.length % 2 === 0 ? 2 : 1);
          return (
            <Box key={chainId} style={{ flexGrow: 1, flexBasis: GRID_ITEM_BASIS, maxWidth: GRID_ITEM_MAX_WIDTH }}>
              <BridgeButton chainId={chainId} />
              {index % 2 === 0 && <VerticalDivider />}
              {isLastVisibleRow && <HorizontalDivider />}
            </Box>
          );
        })}
        {initiallyVisibleChains.length % 2 !== 0 && !hasExpandableContent && (
          <Box style={{ flexGrow: 1, flexBasis: GRID_ITEM_BASIS, maxWidth: GRID_ITEM_MAX_WIDTH }}>
            <Placeholder />
          </Box>
        )}
        {hasExpandableContent && (
          <Box style={{ flexGrow: 1, flexBasis: GRID_ITEM_BASIS, maxWidth: GRID_ITEM_MAX_WIDTH }}>
            <AnimatedBox style={moreButtonStyle}>
              <ToggleExpansionButton isExpanded={isExpanded} mode="expand" />
            </AnimatedBox>
            <AnimatedBox position="absolute" style={[{ width: '100%' }, expandedContentStyle]}>
              <BridgeButton chainId={firstExpandedChain} />
            </AnimatedBox>
          </Box>
        )}
      </View>
      {hasExpandableContent && (
        <AnimatedBox style={[contentStyle, expandedContentStyle]}>
          <View style={{ flexDirection: 'row', gap: GRID_GAP }}>
            <View style={{ flexGrow: 1 }}>
              <HorizontalDivider />
            </View>
            <View style={{ flexGrow: 1 }}>
              <HorizontalDivider />
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, paddingTop: GRID_GAP }}>
            {remainingExpandedChains.map((chainId, index) => {
              const isLastRow =
                remainingExpandedChains.length % 2 === 0
                  ? index >= remainingExpandedChains.length
                  : index >= remainingExpandedChains.length - 1;
              return (
                <Box key={chainId} style={{ flexGrow: 1, flexBasis: GRID_ITEM_BASIS, maxWidth: GRID_ITEM_MAX_WIDTH }}>
                  <BridgeButton chainId={chainId} />
                  {index % 2 === 0 && <VerticalDivider />}
                  {!isLastRow && <HorizontalDivider />}
                </Box>
              );
            })}
            <View style={{ flexGrow: 1, flexBasis: GRID_ITEM_BASIS, maxWidth: GRID_ITEM_MAX_WIDTH }}>
              <ToggleExpansionButton isExpanded={isExpanded} mode="collapse" />
              {remainingExpandedChains.length % 2 === 0 && <VerticalDivider />}
            </View>
            {remainingExpandedChains.length % 2 === 0 && (
              <Box style={{ flexGrow: 1, flexBasis: GRID_ITEM_BASIS, maxWidth: GRID_ITEM_MAX_WIDTH }}>
                <Placeholder />
              </Box>
            )}
          </View>
        </AnimatedBox>
      )}
    </Box>
  );
});
