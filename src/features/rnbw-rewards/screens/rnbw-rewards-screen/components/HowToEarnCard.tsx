import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Box, Text } from '@/design-system';
import ethImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/eth.png';
import usdcImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/usdc.png';
import bridgeImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/bridge.png';
import baseImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/base.png';
import btcImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/btc.png';

export const HowToEarnCard = memo(function HowToEarnCard() {
  return (
    <Box
      height={188}
      borderRadius={32}
      borderColor={{ custom: 'rgba(255, 255, 255, 0.08)' }}
      backgroundColor={'rgba(255, 255, 255, 0.04)'}
      width="full"
      style={{ overflow: 'visible' }}
    >
      <View style={styles.iconsContainer}>
        <Box flexDirection="row" alignItems="center" justifyContent="center">
          <Image source={ethImage} style={{ width: 36, height: 36, marginRight: -6 }} />
          <Image source={usdcImage} style={{ width: 48, height: 48, marginRight: -10 }} />
          <Image source={bridgeImage} style={{ width: 64, height: 64, zIndex: 2 }} />
          <Image source={baseImage} style={{ width: 48, height: 48, marginLeft: -10, zIndex: 1 }} />
          <Image source={btcImage} style={{ width: 36, height: 36, marginLeft: -6 }} />
        </Box>
      </View>

      <Box gap={20} paddingTop={{ custom: 32 + 24 }} paddingHorizontal={'36px'}>
        <Text size="26pt" weight="heavy" color="label" align="center">
          {'Swap To Earn'}
        </Text>
        <Text size="17pt / 135%" weight="semibold" color="labelSecondary" align="center">
          {'You Can Earn $RNBW by Swapping Tokens. Rewards for Perps and Predictions are Coming Later.'}
        </Text>
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  iconsContainer: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    justifyContent: 'center',
    zIndex: 999999,
  },
});
