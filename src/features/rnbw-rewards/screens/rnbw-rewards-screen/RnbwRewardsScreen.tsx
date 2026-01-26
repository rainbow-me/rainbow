import { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountImage } from '@/components/AccountImage';
import { BottomGradientGlow } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/BottomGradientGlow';
import { RnbwHeroCoin } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import { AmbientCoins } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/AmbientCoins';
import {
  AirdropEligibilityScene,
  AirdropClaimingScene,
  RewardsClaimingScene,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/ActionStatusScenes';
import {
  RnbwRewardsFlowContextProvider,
  useRnbwRewardsFlowContext,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { AirdropIntroScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/AirdropIntroScene';
import { AirdropClaimPromptScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/AirdropClaimPromptScene';
import { AirdropClaimedScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/AirdropClaimedScene';
import { RewardsOverviewScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/RewardsOverviewScene';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { AirdropUnavailableScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/AirdropUnavailableScene';
import { Box, ColorModeProvider, Text } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import rnbwCoinImage from '@/assets/rnbw.png';
import { useRewardsFlowStore } from '@/features/rnbw-rewards/stores/rewardsFlowStore';

export const RnbwRewardsScreen = memo(function RnbwRewardsScreen() {
  return (
    <ColorModeProvider value="dark">
      <RnbwRewardsFlowContextProvider>
        <View style={styles.container}>
          <RnbwRewardsContent />
        </View>
      </RnbwRewardsFlowContextProvider>
    </ColorModeProvider>
  );
});

function RnbwRewardsContent() {
  const { scrollOffset } = useRnbwRewardsFlowContext();
  const tabBarOffset = useTabBarOffset();
  const safeAreaInsets = useSafeAreaInsets();

  const rnbwCoinAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -scrollOffset.value }],
    };
  }, [scrollOffset]);

  return (
    <View style={styles.flex}>
      <RnbwRewardsNavbar />
      <View style={{ flex: 1, paddingBottom: tabBarOffset, paddingTop: safeAreaInsets.top + navbarHeight }}>
        <BottomGradientGlow />
        <Animated.View style={rnbwCoinAnimatedStyle}>
          <RnbwHeroCoin />
        </Animated.View>
        <AmbientCoins />
        <RnbwRewardsSceneRouter />
      </View>
    </View>
  );
}

const RnbwRewardsNavbar = memo(function RnbwRewardsNavbar() {
  const activeScene = useRewardsFlowStore(state => state.activeScene);

  const navbarTitle = useMemo(() => {
    return activeScene === RnbwRewardsScenes.RewardsOverview ? 'Rewards' : '';
  }, [activeScene]);

  const navbarRightComponent = useMemo(() => {
    return activeScene === RnbwRewardsScenes.RewardsOverview ? <NavbarRnbwBalance /> : null;
  }, [activeScene]);

  return <Navbar title={navbarTitle} leftComponent={<AccountImage />} rightComponent={navbarRightComponent} floating />;
});

function NavbarRnbwBalance() {
  // TODO: This will require knowing the RNBW token contract address
  const rnbwBalance = 123.5;
  return (
    <Box
      paddingVertical={'8px'}
      paddingLeft={'8px'}
      paddingRight={'10px'}
      borderWidth={1}
      borderColor="separatorTertiary"
      borderRadius={32}
      backgroundColor={opacityWorklet('#F5F8FF', 0.06)}
      flexDirection="row"
      alignItems="center"
      gap={4}
    >
      <Image source={rnbwCoinImage} style={{ width: 22, height: 22 }} />
      <Text size="15pt" weight="bold" color="label">
        {rnbwBalance}
      </Text>
    </Box>
  );
}

function RnbwRewardsSceneRouter() {
  const activeScene = useRewardsFlowStore(state => state.activeScene);

  return (
    <View style={styles.flex}>
      {activeScene === RnbwRewardsScenes.AirdropIntro && <AirdropIntroScene />}
      {activeScene === RnbwRewardsScenes.AirdropEligibility && <AirdropEligibilityScene />}
      {activeScene === RnbwRewardsScenes.AirdropClaimPrompt && <AirdropClaimPromptScene />}
      {activeScene === RnbwRewardsScenes.AirdropClaiming && <AirdropClaimingScene />}
      {activeScene === RnbwRewardsScenes.AirdropClaimed && <AirdropClaimedScene />}
      {activeScene === RnbwRewardsScenes.RewardsClaiming && <RewardsClaimingScene />}
      {activeScene === RnbwRewardsScenes.AirdropUnavailable && <AirdropUnavailableScene />}
      {activeScene === RnbwRewardsScenes.RewardsOverview && <RewardsOverviewScene />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  flex: {
    flex: 1,
  },
});
