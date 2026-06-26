import Animated from 'react-native-reanimated';

import { Box, Stack, Text } from '@/design-system';
import { NFTS_ENABLED } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import * as i18n from '@/languages';

import { TokenFamilyHeaderHeight } from './NFTLoadingSkeleton';

export function NFTEmptyState() {
  const { nfts_enabled } = useRemoteConfig();

  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;

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
        </Stack>
      </Box>
    </Box>
  );
}
