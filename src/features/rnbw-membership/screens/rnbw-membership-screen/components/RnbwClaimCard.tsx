import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';
import { Image, StyleSheet } from 'react-native';
import { memo } from 'react';
import rnbwCoinImage from '@/assets/rnbw.png';
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
    <Box background="surfacePrimary" borderRadius={24} padding="20px" gap={20} shadow={'18px'}>
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
        <ButtonPressAnimation onPress={onPressClaim} scaleTo={0.96}>
          <Box backgroundColor="yellow" borderRadius={21} gap={20} width={94} height={42} justifyContent="center" alignItems="center">
            <Text size="22pt" weight="heavy" color="label">
              {i18n.t(i18n.l.button.claim)}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Box>
    </Box>
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
