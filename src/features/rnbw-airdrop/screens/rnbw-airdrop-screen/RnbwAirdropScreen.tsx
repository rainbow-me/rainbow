import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetHandleFixedToTop from '@/components/sheet/SheetHandleFixedToTop';
import { RnbwHeroCoin } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/components/RnbwHeroCoin';
import { AmbientCoins } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/components/AmbientCoins';
import { BottomGradientGlow } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/components/BottomGradientGlow';
import { RnbwAirdropScenes } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/constants/airdropScenes';
import { ColorModeProvider } from '@/design-system';
import { useAirdropFlowStore, airdropFlowActions } from '@/features/rnbw-airdrop/stores/airdropFlowStore';
import { AirdropClaimPromptScene } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/scenes/AirdropClaimPromptScene';
import { AirdropClaimingScene } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/scenes/AirdropClaimingScene';
import { AirdropClaimedScene } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/scenes/AirdropClaimedScene';

export const RnbwAirdropScreen = memo(function RnbwAirdropScreen() {
  const { top: safeAreaTop, bottom: safeAreaBottom } = useSafeAreaInsets();

  useEffect(() => {
    airdropFlowActions.reset();
  }, []);

  return (
    <ColorModeProvider value="dark">
      <View style={styles.container} testID="rnbw-airdrop-screen">
        <SheetHandleFixedToTop color="rgba(245, 248, 255, 0.3)" top={safeAreaTop + 6} />
        <View style={[styles.flex, { marginTop: safeAreaTop, paddingBottom: safeAreaBottom }]}>
          <BottomGradientGlow />
          <AmbientCoins />
          <RnbwHeroCoin />
          <RnbwAirdropSceneRouter />
        </View>
      </View>
    </ColorModeProvider>
  );
});

function RnbwAirdropSceneRouter() {
  const activeScene = useAirdropFlowStore(state => state.activeScene);

  return (
    <View style={styles.flex}>
      {activeScene === RnbwAirdropScenes.AirdropClaimPrompt && <AirdropClaimPromptScene />}
      {activeScene === RnbwAirdropScenes.AirdropClaiming && <AirdropClaimingScene />}
      {activeScene === RnbwAirdropScenes.AirdropClaimed && <AirdropClaimedScene />}
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
