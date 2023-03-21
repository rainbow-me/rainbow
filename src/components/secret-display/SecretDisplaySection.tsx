import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import { upperFirst } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import {
  createdWithBiometricError,
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { BiometricButtonContent, Button } from '../buttons';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import SecretDisplayCard from './SecretDisplayCard';
import { Box, Inline, Stack, Text } from '@/design-system';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { useWallets } from '@/hooks';
import styled from '@/styled-thing';
import { margin, position, shadow } from '@/styles';
import { useTheme } from '@/theme';
import logger from '@/utils/logger';

const ErrorStates = {
  noSeed: 'noSeed',
  securedWithBiometrics: 'securedWithBiometrics',
} as const;

const CopyButtonIcon = styled(Icon).attrs(({ theme: { colors } }: any) => ({
  color: colors.appleBlue,
  name: 'copy',
}))({
  ...position.sizeAsObject(16),
  marginTop: 0.5,
});

const ToggleSecretButton = styled(Button)(({ theme: { colors } }: any) => ({
  ...margin.object(0, 20),
  ...shadow.buildAsObject(0, 5, 15, colors.purple, 0.3),
  backgroundColor: colors.appleBlue,
}));

const LoadingSpinner = android ? Spinner : ActivityIndicator;

interface SecretDisplaySectionProps {
  onSecretLoaded?: (seedExists: boolean) => void;
  onWalletTypeIdentified?: (walletType: EthereumWalletType) => void;
}

export default function SecretDisplaySection({
  onSecretLoaded,
  onWalletTypeIdentified,
}: SecretDisplaySectionProps) {
  const { params } = useRoute();
  const { selectedWallet, wallets } = useWallets();
  const walletId = (params as any)?.walletId || selectedWallet.id;
  const currentWallet = wallets?.[walletId];
  const [visible, setVisible] = useState(true);
  const [errorState, setErrorState] = useState<
    keyof typeof ErrorStates | undefined
  >();
  const [seed, setSeed] = useState<string | null>(null);
  const [type, setType] = useState(currentWallet?.type);

  const loadSeed = useCallback(async () => {
    try {
      const s = await loadSeedPhraseAndMigrateIfNeeded(walletId);
      if (s) {
        const walletType = identifyWalletType(s);
        setType(walletType);
        onWalletTypeIdentified?.(walletType);
        setSeed(s);
      }
      setVisible(!!s);
      onSecretLoaded?.(!!s);
      if (!s) {
        setErrorState(ErrorStates.noSeed);
      }
    } catch (e: any) {
      logger.sentry('Error while trying to reveal secret', e);
      if (e?.message === createdWithBiometricError) {
        setErrorState(ErrorStates.securedWithBiometrics);
      }
      captureException(e);
      setVisible(false);
      onSecretLoaded?.(false);
    }
  }, [onSecretLoaded, onWalletTypeIdentified, walletId]);

  useEffect(() => {
    // Android doesn't like to show the faceID prompt
    // while the view isn't fully visible
    // so we have to add a timeout to prevent the app from freezing
    android
      ? setTimeout(() => {
          loadSeed();
        }, 300)
      : loadSeed();
  }, [loadSeed]);

  const typeLabel = type === WalletTypes.privateKey ? 'key' : 'phrase';

  const { colors } = useTheme();

  const renderStepNoSeeds = useCallback(() => {
    if (errorState) {
      return (
        <Box
          alignItems="center"
          justifyContent="center"
          paddingHorizontal="60px"
        >
          <Text
            align="center"
            color="secondary60 (Deprecated)"
            size="16px / 22px (Deprecated)"
          >
            {errorState === ErrorStates.securedWithBiometrics &&
              lang.t('back_up.secret.biometrically_secured')}
            {errorState === ErrorStates.noSeed &&
              lang.t('back_up.secret.no_seed_phrase')}
          </Text>
        </Box>
      );
    }
    return (
      <Box alignItems="center" justifyContent="center" paddingHorizontal="60px">
        <Stack space="10px">
          <Text
            align="center"
            color="secondary (Deprecated)"
            size="18px / 27px (Deprecated)"
            weight="regular"
          >
            {lang.t('back_up.secret.you_need_to_authenticate', {
              typeName: typeLabel,
            })}
          </Text>
          <ToggleSecretButton onPress={loadSeed}>
            {/* @ts-ignore */}
            <BiometricButtonContent
              color={colors.white}
              label={lang.t('back_up.secret.show_recovery', {
                typeName: upperFirst(typeLabel),
              })}
              showIcon={!seed}
            />
          </ToggleSecretButton>
        </Stack>
      </Box>
    );
  }, [errorState, typeLabel, loadSeed, colors.white, seed]);
  return (
    <>
      {visible ? (
        <Box
          alignItems="center"
          justifyContent="center"
          paddingBottom="30px (Deprecated)"
          paddingHorizontal={{ custom: 46 }}
        >
          {seed ? (
            <>
              <Box paddingBottom="19px (Deprecated)">
                {/* @ts-ignore */}
                <CopyFloatingEmojis textToCopy={seed}>
                  <Inline alignVertical="center" space="6px">
                    <CopyButtonIcon />
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
                {/* @ts-ignore */}
                <SecretDisplayCard seed={seed} type={type} />
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
            </>
          ) : (
            <LoadingSpinner color={colors.blueGreyDark50} />
          )}
        </Box>
      ) : (
        renderStepNoSeeds()
      )}
    </>
  );
}
