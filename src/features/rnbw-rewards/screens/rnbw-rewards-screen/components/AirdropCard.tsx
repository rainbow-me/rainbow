import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Box, Text } from '@/design-system';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { convertAmountToBalanceDisplayWorklet } from '@/helpers/utilities';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT } from '@/__swaps__/screens/Swap/constants';
import rnbwCoinImage from '@/assets/rnbw.png';
import { BlurView } from 'react-native-blur-view';
import {
  ClaimSteps,
  useRnbwRewardsTransitionContext,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';

export const AirdropCard = memo(function AirdropCard() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const { tokenAmount, nativeCurrencyAmount } = useRnbwAirdropStore(state => state.getBalance());
  return (
    <ButtonPressAnimation onPress={() => setActiveStep(ClaimSteps.AirdropIntroduction)} scaleTo={0.96}>
      <View style={{ overflow: 'visible' }}>
        <Box
          backgroundColor={opacityWorklet(ETH_COLOR_DARK, 0.06)}
          borderColor={{ custom: opacityWorklet(ETH_COLOR_DARK_ACCENT, 0.06) }}
          borderRadius={32}
          paddingVertical="24px"
          paddingHorizontal="20px"
          style={{ overflow: 'visible' }}
        >
          <BackgroundCoins />
          <Box gap={20}>
            <Box paddingLeft={'4px'}>
              <Text size="15pt" weight="heavy" color="labelTertiary">
                {'YOUR AIRDROP'}
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center" gap={12}>
              <Image source={rnbwCoinImage} style={styles.coinImage} />
              <Box gap={12}>
                <Text size="26pt" weight="heavy" color="label">
                  {nativeCurrencyAmount}
                </Text>
                <Text size="17pt" weight="semibold" color="labelTertiary">
                  {`${convertAmountToBalanceDisplayWorklet(tokenAmount, { decimals: 2, symbol: 'RNBW' })}`}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </View>
    </ButtonPressAnimation>
  );
});

// TODO: clean styles / blur config
const BackgroundCoins = memo(function BackgroundCoins() {
  return (
    <View style={[StyleSheet.absoluteFill]}>
      <View style={StyleSheet.absoluteFill}>
        <View style={{ position: 'absolute', top: -21, right: 59, transform: [{ rotate: '11.11deg' }], opacity: 0.9 }}>
          <Image source={rnbwCoinImage} style={{ width: 61, height: 61 }} />
          <BlurView
            style={{ position: 'absolute', top: -1.5 * 3, left: -1.5 * 3, right: -1.5 * 3, bottom: -1.5 * 3 }}
            blurStyle="plain"
            blurIntensity={1.5}
          />
        </View>
      </View>
      <View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}>
        <View style={{ position: 'absolute', bottom: -40, right: -30, transform: [{ rotate: '-13.39deg' }], opacity: 0.7 }}>
          <Image source={rnbwCoinImage} style={{ width: 122, height: 122 }} />
          <BlurView
            style={{ position: 'absolute', top: -2 * 3, left: -2 * 3, right: -2 * 3, bottom: -2 * 3 }}
            blurStyle="plain"
            blurIntensity={2}
          />
        </View>
        <View style={{ position: 'absolute', bottom: 14, right: 100, transform: [{ rotate: '23.77deg' }] }}>
          <Image source={rnbwCoinImage} style={{ width: 31, height: 31 }} />
          <BlurView
            style={{ position: 'absolute', top: -1 * 3, left: -1 * 3, right: -1 * 3, bottom: -1 * 3 }}
            blurStyle="plain"
            blurIntensity={1}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  coinImage: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
});
