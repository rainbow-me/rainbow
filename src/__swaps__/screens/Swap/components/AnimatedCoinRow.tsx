import React, { useCallback, useEffect, useRef } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedText, Box, HitSlop, Inline } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { isFavorite, toggleFavorite } from '@/resources/favorites';
import { ETH_ADDRESS } from '@/references';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { SearchAsset } from '@/__swaps__/types/search';
import { AddressZero } from '@ethersproject/constants';

export const AnimatedCoinRow = ({
  sectionData,
  index,
  onPress,
  output,
}: {
  sectionData: SharedValue<SearchAsset[]>;
  index: number;
  onPress: (asset: SearchAsset) => void;
  output?: boolean;
}) => {
  const asset: Readonly<SharedValue<SearchAsset | undefined>> = useDerivedValue(() => sectionData.value?.[index]);
  const name: Readonly<SharedValue<string | undefined>> = useDerivedValue(() => asset.value?.name);
  const symbol: Readonly<SharedValue<string | undefined>> = useDerivedValue(() => asset.value?.symbol);
  const address: Readonly<SharedValue<string | undefined>> = useDerivedValue(() => asset.value?.address);

  const isFavorited: SharedValue<boolean> = useSharedValue(address.value ? isFavorite(address.value) : false);

  const updateFavorite = useCallback(() => {
    if (address.value) {
      isFavorited.value = isFavorite(address.value === AddressZero ? ETH_ADDRESS : address.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAnimatedReaction(
    () => address.value,
    (current, previous) => {
      if (current && current !== previous) {
        runOnJS(updateFavorite)();
      }
    }
  );

  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current = renderCount.current + 1;
    console.log(`Rendered ${symbol.value} ${renderCount.current} times`);
  });

  const isTrending = false;
  const balance = '';

  const percentChange = useDerivedValue(() => {
    if (isTrending) {
      const rawChange = Math.random() * 30;
      const isNegative = Math.random() < 0.2;
      const prefix = isNegative ? '-' : '+';
      const color: TextColor = isNegative ? 'red' : 'green';
      const change = `${rawChange.toFixed(1)}%`;

      return { change, color, prefix };
    }
  });
  const percentChangeChange = useDerivedValue(() => percentChange?.value?.change);
  const percentChangeColor = useDerivedValue(() => percentChange?.value?.color);
  const percentChangePrefix = useDerivedValue(() => percentChange?.value?.prefix);

  const percentChangeContainerAnimatedStyle = useAnimatedStyle(() => ({ display: percentChange.value ? 'flex' : 'none' }));
  const percentChangeAnimatedStyle = useAnimatedStyle(() => ({ color: percentChangeColor.value }));

  const subtitle = useDerivedValue(() => (output ? symbol.value : balance));

  const animatedStyle = useAnimatedStyle(() => ({ display: asset.value ? 'flex' : 'none' }));
  const favoriteButtonColor = useDerivedValue(() => (isFavorited.value ? '#FFCB0F' : undefined));

  return (
    <Animated.View style={animatedStyle} onLayout={e => console.log(e.nativeEvent.layout.height)}>
      <ButtonPressAnimation disallowInterruption onPress={() => asset.value && onPress(asset.value)} scaleTo={0.95}>
        <HitSlop vertical="10px">
          <Box
            alignItems="center"
            paddingVertical="10px"
            paddingHorizontal="20px"
            flexDirection="row"
            justifyContent="space-between"
            width="full"
          >
            <Inline alignVertical="center" space="10px">
              {/* <SwapCoinIcon
              iconUrl={iconUrl}
              address={address}
              mainnetAddress={mainnetAddress}
              large
              network={ethereumUtils.getNetworkFromChainId(chainId)}
              symbol={symbol}
              theme={theme}
              color={color}
            /> */}
              <Box gap={10}>
                <AnimatedText color="label" size="17pt" weight="semibold">
                  {name}
                </AnimatedText>
                <Inline alignVertical="center" space={{ custom: 5 }}>
                  <AnimatedText color="labelTertiary" size="13pt" weight="semibold">
                    {subtitle}
                  </AnimatedText>
                  <Animated.View style={percentChangeContainerAnimatedStyle}>
                    <Inline alignVertical="center" space={{ custom: 1 }}>
                      <AnimatedText align="center" style={percentChangeAnimatedStyle} size="12pt" weight="bold">
                        {percentChangePrefix}
                      </AnimatedText>
                      <AnimatedText style={percentChangeAnimatedStyle} size="13pt" weight="semibold">
                        {percentChangeChange}
                      </AnimatedText>
                    </Inline>
                  </Animated.View>
                </Inline>
              </Box>
            </Inline>
            {output ? (
              <Inline space="8px">
                <CoinRowButton icon="􀅳" outline size="icon 14px" />
                <CoinRowButton
                  color={favoriteButtonColor}
                  onPress={async () => {
                    if (!address.value) return;
                    isFavorited.value = await toggleFavorite(address.value === AddressZero ? ETH_ADDRESS : address.value);
                  }}
                  icon="􀋃"
                  weight="black"
                />
              </Inline>
            ) : (
              <BalancePill balance={balance} />
            )}
          </Box>
        </HitSlop>
      </ButtonPressAnimation>
    </Animated.View>
  );
};
