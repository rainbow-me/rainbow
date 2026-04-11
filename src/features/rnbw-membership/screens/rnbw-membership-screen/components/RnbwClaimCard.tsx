import { memo } from 'react';
import { Image, StyleSheet } from 'react-native';

import rnbwCoinImage from '@/assets/rnbw.png';
import { Box, Text } from '@/design-system';
import { RnbwThemedButton } from '@/features/rnbw-membership/components/RnbwThemedButton';
import { MembershipCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/MembershipCard';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import * as i18n from '@/languages';

type RnbwClaimCardProps = {
  tokenAmount: string;
  nativeCurrencyAmount: string;
  title: string;
  onPressClaim: () => void;
};

export const RnbwClaimCard = memo(function RnbwClaimCard({ tokenAmount, nativeCurrencyAmount, title, onPressClaim }: RnbwClaimCardProps) {
  return (
    <MembershipCard padding="20px">
      <Box gap={20}>
        <Text size="22pt" weight="heavy" color="label">
          {title}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={10}>
          <Image source={rnbwCoinImage} style={styles.coinImage} />
          <Box gap={10} style={styles.flex}>
            <Text size="22pt" weight="heavy" color="label">
              {nativeCurrencyAmount}
            </Text>
            <Text size="17pt" weight="bold" color="labelTertiary">
              {`${tokenAmount} ${RNBW_SYMBOL}`}
            </Text>
          </Box>
          <RnbwThemedButton onPress={onPressClaim} label={i18n.t(i18n.l.button.claim)} containerStyle={{ paddingHorizontal: 16 }} />
        </Box>
      </Box>
    </MembershipCard>
  );
});

const styles = StyleSheet.create({
  coinImage: {
    width: 48,
    height: 48,
  },
  flex: {
    flex: 1,
  },
});
