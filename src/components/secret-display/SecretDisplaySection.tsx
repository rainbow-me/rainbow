import ManuallyBackedUpIcon from '@/assets/ManuallyBackedUp.png';
import { Bleed, Box, Inline, Inset, Stack, Text } from '@/design-system';
import { IS_ANDROID } from '@/env';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { useDimensions, useWalletManualBackup } from '@/hooks';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { createdWithBiometricError, identifyWalletType, loadPrivateKey, loadSeedPhraseAndMigrateIfNeeded } from '@/model/wallet';
import { useTheme } from '@/theme';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { CopyFloatingEmojis } from '../floating-emojis';
import SecretDisplayCard from './SecretDisplayCard';

import { SecretDisplayError } from '@/components/secret-display/SecretDisplayError';
import { SecretDisplayStates, SecretDisplayStatesType } from '@/components/secret-display/states';
import WalletBackupTypes from '@/helpers/walletBackupTypes';
import { useNavigation } from '@/navigation';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { backupsStore } from '@/state/backups/backups';
import { useSelectedWallet, useWallets } from '@/state/wallets/walletsStore';
import { InteractionManager } from 'react-native';
import { Source } from 'react-native-fast-image';
import { ImgixImage } from '../images';
import { SheetActionButton } from '../sheet';

const MIN_HEIGHT = 740;

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

type WrapperProps = {
  children?: ReactNode;
};

function Wrapper({ children }: WrapperProps) {
  return (
    <Box alignItems="center" justifyContent="center" paddingBottom="30px (Deprecated)" paddingHorizontal={{ custom: 46 }}>
      {children}
    </Box>
  );
}

type Props = {
  onSecretLoaded?: (loaded: boolean) => void;
  onWalletTypeIdentified?: (walletType: EthereumWalletType) => void;
};

export function SecretDisplaySection({ onSecretLoaded, onWalletTypeIdentified }: Props) {
  const { height: deviceHeight } = useDimensions();
  const { colors } = useTheme();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.SHOW_SECRET>>();
  const selectedWallet = useSelectedWallet();
  const wallets = useWallets();
  const backupProvider = backupsStore(state => state.backupProvider);
  const { onManuallyBackupWalletId } = useWalletManualBackup();
  const { navigate } = useNavigation();

  const { isBackingUp, backupType, privateKeyAddress } = params;

  const walletId = params.walletId || selectedWallet?.id || '';
  const currentWallet = wallets?.[walletId];

  const isSecretPhrase = WalletTypes.mnemonic === currentWallet?.type && !privateKeyAddress;
  const btnText = isSecretPhrase ? i18n.t(i18n.l.back_up.manual.seed.confirm_save) : i18n.t(i18n.l.back_up.manual.pkey.confirm_save);

  const description = isSecretPhrase ? i18n.t(i18n.l.back_up.manual.seed.description) : i18n.t(i18n.l.back_up.manual.pkey.description);

  const [sectionState, setSectionState] = useState<SecretDisplayStatesType>(SecretDisplayStates.loading);
  const [seed, setSeed] = useState<string | null>(null);
  const [walletType, setWalletType] = useState(currentWallet?.type);

  const loadSeed = useCallback(async () => {
    try {
      if (privateKeyAddress) {
        const privateKeyData = await loadPrivateKey(privateKeyAddress, false);
        if (privateKeyData === -1 || privateKeyData === -2 || !privateKeyData) {
          setSectionState(SecretDisplayStates.noSeed);
          return;
        }
        setSeed(privateKeyData);
        setSectionState(SecretDisplayStates.revealed);
        return;
      }

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
      logger.error(new RainbowError('[SecretDisplaySection]: Error while trying to reveal secret'), {
        error: message,
      });
      setSectionState(message === createdWithBiometricError ? SecretDisplayStates.securedWithBiometrics : SecretDisplayStates.noSeed);
      onSecretLoaded?.(false);
    }
  }, [onSecretLoaded, privateKeyAddress, onWalletTypeIdentified, walletId]);

  useEffect(() => {
    // We need to run this after interactions since there were issues on Android
    InteractionManager.runAfterInteractions(() => {
      loadSeed();
    });
  }, [loadSeed]);

  const handleConfirmSaved = useCallback(() => {
    if (backupType === WalletBackupTypes.manual) {
      onManuallyBackupWalletId(walletId);
      if (!backupProvider) {
        backupsStore.getState().setBackupProvider(WalletBackupTypes.manual);
      }
      navigate(Routes.SETTINGS_SECTION_BACKUP);
    }
  }, [backupType, onManuallyBackupWalletId, walletId, backupProvider, navigate]);

  const getIconForBackupType = useCallback(() => {
    if (isBackingUp) {
      if (backupType === WalletBackupTypes.manual) {
        return '􀈌';
      }
      return '􀉆';
    }

    if (isSecretPhrase) {
      return '􀉆';
    }

    return '􀟖';
  }, [isBackingUp, backupType, isSecretPhrase]);

  const getTitleForBackupType = useCallback(() => {
    if (isBackingUp) {
      return i18n.t(i18n.l.back_up.manual.label, {
        typeName: isSecretPhrase ? 'Secret Phrase' : 'Private Key',
      });
    }

    return i18n.t(i18n.l.back_up.manual.with_your_label, {
      typeName: isSecretPhrase ? 'Secret Phrase' : 'Private Key',
    });
  }, [isBackingUp, isSecretPhrase]);

  const isSmallPhone = deviceHeight < MIN_HEIGHT;
  const contentHeight = deviceHeight - (!isSmallPhone ? sharedCoolModalTopOffset : 0) - 100;

  switch (sectionState) {
    case SecretDisplayStates.loading:
      return (
        <Wrapper>
          <LoadingSpinner color={colors.blueGreyDark50} />
        </Wrapper>
      );
    case SecretDisplayStates.noSeed:
      return <SecretDisplayError message={i18n.t(i18n.l.back_up.secret.no_seed_phrase)} />;
    case SecretDisplayStates.securedWithBiometrics:
      return <SecretDisplayError message={i18n.t(i18n.l.back_up.secret.biometrically_secured)} />;
    case SecretDisplayStates.revealed:
      return (
        <Box style={{ height: contentHeight }}>
          <Inset horizontal={'24px'} top={'104px'}>
            <Bleed top={'42px (Deprecated)'}>
              <Stack alignHorizontal="center" space={'20px'}>
                {backupType === WalletBackupTypes.manual ? (
                  <Box
                    as={ImgixImage}
                    borderRadius={72 / 2}
                    height={{ custom: 72 }}
                    marginLeft={{ custom: -12 }}
                    marginRight={{ custom: -12 }}
                    marginTop={{ custom: 0 }}
                    marginBottom={{ custom: -12 }}
                    source={ManuallyBackedUpIcon as Source}
                    width={{ custom: 72 }}
                    size={72}
                  />
                ) : (
                  <Text align="center" color="orange" size="34pt" weight="bold">
                    {getIconForBackupType()}
                  </Text>
                )}

                <Text align="center" color="label" size="20pt" weight="bold">
                  {getTitleForBackupType()}
                </Text>
                <Stack space="36px">
                  <Text align="center" color="labelTertiary" size="15pt" weight="semibold">
                    {description}
                  </Text>

                  {/* @ts-expect-error JS component*/}
                  <CopyFloatingEmojis textToCopy={seed}>
                    <Inline alignHorizontal="center" alignVertical="center" space="6px">
                      <Text color="action (Deprecated)" size="16px / 22px (Deprecated)" weight="bold" align="center">
                        􀐅 {i18n.t(i18n.l.back_up.secret.copy_to_clipboard)}
                      </Text>
                    </Inline>
                  </CopyFloatingEmojis>
                </Stack>

                <Stack alignHorizontal="center" space="19px (Deprecated)">
                  <SecretDisplayCard seed={seed ?? ''} type={privateKeyAddress ? WalletTypes.privateKey : walletType} />
                </Stack>
              </Stack>
            </Bleed>
          </Inset>

          {isBackingUp && (
            <Box
              position="absolute"
              testID={'saved-these-words'}
              bottom={{ custom: 20 }}
              alignItems="center"
              style={{ paddingHorizontal: 24 }}
            >
              <SheetActionButton label={btnText} color="blue" weight="bold" onPress={handleConfirmSaved} />
            </Box>
          )}
        </Box>
      );
    default:
      logger.error(new RainbowError(`[SecretDisplaySection]: Secret display section state unknown ${sectionState}`));
      return null;
  }
}
