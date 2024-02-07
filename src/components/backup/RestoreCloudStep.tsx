import * as lang from '@/languages';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';
import WalletAndBackup from '@/assets/WalletsAndBackup.png';
import { KeyboardArea } from 'react-native-keyboard-area';

import { Backup, fetchBackupPassword, restoreCloudBackup, RestoreCloudBackupResultStates, saveBackupPassword } from '@/model/backup';
import { cloudPlatform } from '@/utils/platform';
import { PasswordField } from '../fields';
import { Text } from '../text';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { cloudBackupPasswordMinLength, isCloudBackupPasswordValid, normalizeAndroidBackupFilename } from '@/handlers/cloudBackup';
import { removeWalletData } from '@/handlers/localstorage/removeWallet';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { useDimensions, useInitializeWallet, useUserAccounts } from '@/hooks';
import { useNavigation } from '@/navigation';
import { addressSetSelected, setAllWalletsWithIdsAsBackedUp, walletsLoadState, walletsSetSelected } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { logger } from '@/logger';
import { Box, Inset, Stack } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { ImgixImage } from '../images';
import { RainbowButton } from '../buttons';
import RainbowButtonTypes from '../buttons/rainbow-button/RainbowButtonTypes';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RestoreSheetParams } from '@/screens/RestoreSheet';
import { Source } from 'react-native-fast-image';

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'heavy',
})({
  ...padding.object(12, 0, 0),
});

const DescriptionText = styled(Text).attrs(({ theme: { colors }, color }: any) => ({
  align: 'left',
  color: color || colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'lmedium',
  weight: 'medium',
}))({});

const Masthead = styled(Box).attrs({
  direction: 'column',
})({
  ...padding.object(0, 0, 16),
  gap: 8,
  flexShrink: 0,
});

const KeyboardSizeView = styled(KeyboardArea)({
  backgroundColor: ({ theme: { colors } }: any) => colors.transparent,
});

type RestoreCloudStepParams = {
  RestoreSheet: {
    selectedBackup: Backup;
  };
};

export default function RestoreCloudStep() {
  const { params } = useRoute<RouteProp<RestoreCloudStepParams & RestoreSheetParams, 'RestoreSheet'>>();

  const { userData, selectedBackup } = params;

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { goBack, replace } = useNavigation();
  const [validPassword, setValidPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput | null>(null);
  const { userAccounts } = useUserAccounts();
  const initializeWallet = useInitializeWallet();

  useEffect(() => {
    const fetchPasswordIfPossible = async () => {
      const pwd = await fetchBackupPassword();
      if (pwd) {
        setPassword(pwd);
      }
    };
    fetchPasswordIfPossible();
  }, []);

  useEffect(() => {
    let passwordIsValid = false;
    if (isCloudBackupPasswordValid(password)) {
      passwordIsValid = true;
    }

    setValidPassword(passwordIsValid);
  }, [incorrectPassword, password]);

  const onPasswordChange = useCallback(({ nativeEvent: { text: inputText } }: { nativeEvent: { text: string } }) => {
    setPassword(inputText);
    setIncorrectPassword(false);
  }, []);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    try {
      if (!selectedBackup.name) {
        throw new Error('No backup file selected');
      }

      const status = await restoreCloudBackup({
        password,
        userData,
        backupSelected: selectedBackup.name,
      });

      if (status === RestoreCloudBackupResultStates.success) {
        goBack();

        // Store it in the keychain in case it was missing
        await saveBackupPassword(password);

        // Get rid of the old wallets
        for (let i = 0; i < userAccounts.length; i++) {
          const account = userAccounts[i];
          await removeWalletData(account.address);
        }

        InteractionManager.runAfterInteractions(async () => {
          const wallets = await dispatch(walletsLoadState());
          if (!userData && selectedBackup.name) {
            goBack();
            logger.info('Updating backup state of wallets');
            let filename = selectedBackup.name;
            if (IS_ANDROID && filename) {
              /**
               * We need to normalize the filename on Android, because sometimes
               * the filename is returned with the path used for Google Drive storage.
               * That is with REMOTE_BACKUP_WALLET_DIR included.
               */
              filename = normalizeAndroidBackupFilename(filename);
            }
            const walletIdsToUpdate = Object.keys(wallets);
            logger.log('updating backup state of wallets with ids', {
              walletIds: JSON.stringify(walletIdsToUpdate),
            });
            logger.log('backupSelected.name', {
              fileName: selectedBackup.name,
            });
            await dispatch(setAllWalletsWithIdsAsBackedUp(walletIdsToUpdate, walletBackupTypes.cloud, filename, false));
            logger.info('Done updating backup state');
          }
          const walletKeys = Object.keys(wallets || {});
          const firstWallet =
            // @ts-expect-error TypeScript doesn't play nicely with Redux types here
            walletKeys.length > 0 ? (wallets || {})[walletKeys[0]] : undefined;
          const firstAddress = firstWallet ? firstWallet.addresses[0].address : undefined;
          const p1 = dispatch(walletsSetSelected(firstWallet));
          const p2 = dispatch(addressSetSelected(firstAddress));
          await Promise.all([p1, p2]);
          await initializeWallet(null, null, null, false, false, null, true, null);

          replace(Routes.SWIPE_LAYOUT);
          setLoading(false);
        });
      } else {
        switch (status) {
          case RestoreCloudBackupResultStates.incorrectPassword:
            setIncorrectPassword(true);
            break;
          case RestoreCloudBackupResultStates.incorrectPinCode:
            Alert.alert(lang.t('back_up.restore_cloud.incorrect_pin_code'));
            break;
          default:
            Alert.alert(lang.t('back_up.restore_cloud.error_while_restoring'));
            break;
        }
      }
    } catch (e) {
      Alert.alert(lang.t('back_up.restore_cloud.error_while_restoring'));
    }

    setLoading(false);
  }, [selectedBackup, dispatch, initializeWallet, goBack, replace, password, userAccounts, userData]);

  const onPasswordSubmit = useCallback(() => {
    validPassword && onSubmit();
  }, [onSubmit, validPassword]);

  const isPasswordValid =
    (password !== '' && password.length < cloudBackupPasswordMinLength && !passwordRef?.current?.isFocused()) || incorrectPassword;

  return (
    <Box height={{ custom: deviceHeight - sharedCoolModalTopOffset - 48 }}>
      <Inset horizontal={'24px'}>
        <Stack alignHorizontal="left" space="8px">
          <Masthead>
            <Box
              as={ImgixImage}
              borderRadius={72 / 2}
              height={{ custom: 72 }}
              marginLeft={{ custom: -12 }}
              marginRight={{ custom: -12 }}
              marginTop={{ custom: 8 }}
              marginBottom={{ custom: -24 }}
              source={WalletAndBackup as Source}
              width={{ custom: 72 }}
              size={72}
            />
            <Stack space="4px">
              <Title>{lang.t(lang.l.back_up.cloud.password.enter_backup_password)}</Title>
              <DescriptionText>{lang.t(lang.l.back_up.cloud.password.to_restore_from_backup)}</DescriptionText>
            </Stack>
          </Masthead>
          <Box gap={12}>
            <PasswordField
              autoFocus
              isInvalid={isPasswordValid}
              onChange={onPasswordChange}
              onSubmitEditing={onPasswordSubmit}
              password={password}
              placeholder={lang.t('back_up.restore_cloud.backup_password_placeholder')}
              ref={passwordRef}
              returnKeyType="next"
            />
          </Box>
        </Stack>

        <Box paddingTop="16px" justifyContent="flex-end">
          <RainbowButton
            height={46}
            width={deviceWidth - 48}
            disabled={!validPassword || loading}
            type={RainbowButtonTypes.backup}
            label={`􀎽 ${lang.t(lang.l.back_up.cloud.back_up_to_platform, {
              cloudPlatformName: cloudPlatform,
            })}`}
            onPress={onSubmit}
          />
          {IS_ANDROID ? <KeyboardSizeView /> : null}
        </Box>
      </Inset>
    </Box>
  );
}
