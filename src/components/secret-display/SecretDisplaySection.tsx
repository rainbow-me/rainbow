import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  createdWithBiometricError,
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '@/model/wallet';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import SecretDisplayCard from './SecretDisplayCard';
import { Box, Inline, Stack, Text } from '@/design-system';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { useWallets } from '@/hooks';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import { logger, RainbowError } from '@/logger';
import { IS_ANDROID } from '@/env';
import {
  SecretDisplayStates,
  SecretDisplayStatesType,
} from '@/components/secret-display/states';
import { SecretDisplayError } from '@/components/secret-display/SecretDisplayError';
import { InteractionManager, StyleSheet } from 'react-native';

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

type WrapperProps = {
  children?: ReactNode;
};

function Wrapper({ children }: WrapperProps) {
  return (
    <Box
      alignItems="center"
      justifyContent="center"
      paddingBottom="30px (Deprecated)"
      paddingHorizontal={{ custom: 46 }}
    >
      {children}
    </Box>
  );
}

type Props = {
  onSecretLoaded?: (seedExists: boolean) => void;
  onWalletTypeIdentified?: (walletType: EthereumWalletType) => void;
};

export function SecretDisplaySection({
  onSecretLoaded,
  onWalletTypeIdentified,
}: Props) {
  const { colors } = useTheme();
  const { params } = useRoute();
  const { selectedWallet, wallets } = useWallets();
  const walletId = (params as any)?.walletId || selectedWallet.id;
  const currentWallet = wallets?.[walletId];
  const [sectionState, setSectionState] = useState<SecretDisplayStatesType>(
    SecretDisplayStates.loading
  );
  const [seed, setSeed] = useState<string | null>(null);
  const [walletType, setWalletType] = useState(currentWallet?.type);

  const loadSeed = useCallback(async () => {
    try {
      const seedPhrase = await loadSeedPhraseAndMigrateIfNeeded(walletId);
      if (seedPhrase) {
        const walletType = identifyWalletType(seedPhrase);
        setWalletType(walletType);
        onWalletTypeIdentified?.(walletType);
        setSeed(seedPhrase);
        setSectionState(SecretDisplayStates.revealed);
      } else {
        setSectionState(SecretDisplayStates.noSeed);
      }
      onSecretLoaded?.(!!seedPhrase);
    } catch (error) {
      const message = (error as Error)?.message;
      logger.error(new RainbowError('Error while trying to reveal secret'), {
        error: message,
      });
      setSectionState(
        message === createdWithBiometricError
          ? SecretDisplayStates.securedWithBiometrics
          : SecretDisplayStates.noSeed
      );
      captureException(error);
      onSecretLoaded?.(false);
    }
  }, [onSecretLoaded, onWalletTypeIdentified, walletId]);

  useEffect(() => {
    // We need to run this after interactions since there were issues on Android
    InteractionManager.runAfterInteractions(() => {
      loadSeed();
    });
  }, [loadSeed]);

  switch (sectionState) {
    case SecretDisplayStates.loading:
      return (
        <Wrapper>
          <LoadingSpinner color={colors.blueGreyDark50} />
        </Wrapper>
      );
    case SecretDisplayStates.noSeed:
      return (
        <SecretDisplayError message={lang.t('back_up.secret.no_seed_phrase')} />
      );
    case SecretDisplayStates.securedWithBiometrics:
      return (
        <SecretDisplayError
          message={lang.t('back_up.secret.biometrically_secured')}
        />
      );
    case SecretDisplayStates.revealed:
      return (
        <Wrapper>
          <Box paddingBottom="19px (Deprecated)">
            {/* @ts-expect-error JS component*/}
            <CopyFloatingEmojis textToCopy={seed}>
              <Inline alignVertical="center" space="6px">
                <Icon
                  name="copy"
                  color={colors.appleBlue}
                  style={styles.copyIcon}
                />
                <Text
                  color="action (Deprecated)"
                  size="16px / 22px (Deprecated)"
                  weight="bold"
                >
                  {lang.t('back_up.secret.copy_to_clipboard')}
                </Text>
              </Inline>
            </CopyFloatingEmojis>
          </Box>
          <Stack alignHorizontal="center" space="19px (Deprecated)">
            <SecretDisplayCard seed={seed ?? ''} type={walletType} />
            <Text
              containsEmoji
              color="primary (Deprecated)"
              size="16px / 22px (Deprecated)"
              weight="bold"
            >
              👆{lang.t('back_up.secret.for_your_eyes_only')} 👆
            </Text>
            <Text
              align="center"
              color="secondary60 (Deprecated)"
              size="16px / 22px (Deprecated)"
              weight="semibold"
            >
              {lang.t('back_up.secret.anyone_who_has_these')}
            </Text>
          </Stack>
        </Wrapper>
      );
    default:
      logger.error(
        new RainbowError(
          'Secret display section tires to present an unknown state'
        )
      );
      return null;
  }
}

const styles = StyleSheet.create({
  copyIcon: {
    ...position.sizeAsObject(16),
    marginTop: 0.5,
  },
});
