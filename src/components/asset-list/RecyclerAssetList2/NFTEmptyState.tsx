import React, { useCallback } from 'react';
import Animated from 'react-native-reanimated';
import { Box, Stack, Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { TokenFamilyHeaderHeight } from './NFTLoadingSkeleton';
import { MINTS, NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useMints } from '@/resources/mints';
import { useAccountSettings } from '@/hooks';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { StyleSheet } from 'react-native';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { analyticsV2 } from '@/analytics';
import { convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import { navigateToMintCollection } from '@/resources/reservoir/mints';

type LaunchFeaturedMintButtonProps = {
  featuredMint: ReturnType<typeof useMints>['data']['featuredMint'];
};

const LaunchFeaturedMintButton = ({ featuredMint }: LaunchFeaturedMintButtonProps) => {
  const { isDarkMode } = useColorMode();

  const handlePress = useCallback(() => {
    if (featuredMint) {
      analyticsV2.track(analyticsV2.event.mintsPressedFeaturedMintCard, {
        contractAddress: featuredMint.contractAddress,
        chainId: featuredMint.chainId,
        totalMints: featuredMint.totalMints,
        mintsLastHour: featuredMint.totalMints,
        priceInEth: convertRawAmountToRoundedDecimal(featuredMint.mintStatus.price, 18, 6),
      });
      navigateToMintCollection(featuredMint.contract, featuredMint.mintStatus.price, featuredMint.chainId);
    }
  }, [featuredMint]);

  return (
    <Box style={{ alignItems: 'center', paddingTop: 12 }}>
      <GestureHandlerButton onPressJS={handlePress} scaleTo={0.9}>
        <Box as={Animated.View} alignItems="center" justifyContent="center" style={styles.buttonPadding}>
          <Box
            alignItems="center"
            as={Animated.View}
            borderRadius={15}
            justifyContent="center"
            paddingVertical="12px"
            paddingHorizontal="20px"
            style={[{ backgroundColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }]}
          >
            <Text size="13pt" color={'label'} style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
              {i18n.t(i18n.l.nfts.collect_now)}
            </Text>
          </Box>
        </Box>
      </GestureHandlerButton>
    </Box>
  );
};

export function NFTEmptyState() {
  const { mints_enabled, nfts_enabled } = useRemoteConfig();
  const { accountAddress } = useAccountSettings();

  const {
    data: { featuredMint },
  } = useMints({ walletAddress: accountAddress });

  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;
  const mintsEnabled = useExperimentalFlag(MINTS) || mints_enabled;

  if (!nftsEnabled) return null;

  return (
    <Box
      alignItems="center"
      as={Animated.View}
      style={[{ alignSelf: 'center', flexDirection: 'row', height: TokenFamilyHeaderHeight * 5 }]}
    >
      <Box paddingHorizontal="44px">
        <Stack space="16px">
          <Text containsEmoji color="label" size="26pt" weight="bold" align="center">
            🌟
          </Text>

          <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
            {i18n.t(i18n.l.nfts.empty)}
          </Text>

          <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
            {i18n.t(i18n.l.nfts.will_appear_here)}
          </Text>

          {mintsEnabled && featuredMint && <LaunchFeaturedMintButton featuredMint={featuredMint} />}
        </Stack>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  buttonPadding: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
