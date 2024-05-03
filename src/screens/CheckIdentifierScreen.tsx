import React, { useCallback, useState } from 'react';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { logger, RainbowError } from '@/logger';
import * as lang from '@/languages';

import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import * as kc from '@/keychain';
import { addressKey } from '@/utils/keychainConstants';
import { Alert } from '@/components/alerts';
import { BackgroundProvider, Bleed, Box, Inline, Inset, Separator, Stack, Text } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { getHeightForStep } from '@/navigation/config';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { ImgixImage } from '@/components/images';
import RestoreYourWallet from '@/assets/RestoreYourWallet.png';
import { Source } from 'react-native-fast-image';
import { useNavigation } from '@/navigation';

const imageSize = 40;

const ErrorAlert = () =>
  Alert({
    buttons: [
      {
        // TODO: Link to support URL
        onPress: () => {},
        text: lang.t(lang.l.check_identifier.error_alert.contact_support),
      },
      {
        style: 'cancel',
        text: lang.t(lang.l.check_identifier.error_alert.cancel),
      },
    ],
    message: lang.t(lang.l.check_identifier.error_alert.message),
    title: lang.t(lang.l.check_identifier.error_alert.title),
  });

export default function CheckIdentifierScreen() {
  const { goBack } = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'CheckIdentifierScreen'>>();

  const { onSuccess, onFailure } = params;

  const sheetHeight = getHeightForStep(walletBackupStepTypes.check_identifier);

  const [isChecking, setIsChecking] = useState(false);

  useAndroidBackHandler(() => {
    return true;
  });

  const onMaybeLater = useCallback(() => goBack(), [goBack]);

  const initAndRunKeychainChecks = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);

    const selectedAddress = await kc.get(addressKey);
    if (selectedAddress.error) {
      switch (selectedAddress.error) {
        case kc.ErrorType.UserCanceled: {
          logger.error(new RainbowError('User canceled keychain addressKey check'), {
            selectedAddress,
          });
          ErrorAlert();
          return;
        }
        case kc.ErrorType.Unavailable: {
          logger.error(new RainbowError('Unavailable error checking keychain addressKey'), {
            selectedAddress,
          });
          ErrorAlert();
          return;
        }
        case kc.ErrorType.NotAuthenticated: {
          logger.error(new RainbowError('Not authenticated error checking keychain addressKey'), {
            selectedAddress,
          });
          ErrorAlert();
          return;
        }

        default: {
          logger.error(new RainbowError('Unknown error checking keychain addressKey'), {
            selectedAddress,
          });
          ErrorAlert();
          return;
        }
      }
    }

    if (!selectedAddress.value) {
      logger.error(new RainbowError('Unable to retrieve value for selectedAddress'), {
        selectedAddress,
      });
      ErrorAlert();
      return;
    }

    const pkey = await kc.get(`${selectedAddress.value}_rainbowPrivateKey`);
    if (pkey.error) {
      switch (pkey.error) {
        case kc.ErrorType.UserCanceled: {
          logger.error(new RainbowError('User canceled keychain rainbowPrivateKey check'), {
            selectedAddress,
          });
          ErrorAlert();
          return;
        }
        case kc.ErrorType.Unavailable: {
          logger.error(new RainbowError('Unavailable error checking keychain rainbowPrivateKey'), {
            selectedAddress,
          });
          ErrorAlert();
          return;
        }
        case kc.ErrorType.NotAuthenticated: {
          logger.error(new RainbowError('Not authenticated error checking keychain rainbowPrivateKey'), {
            selectedAddress,
          });
          ErrorAlert();
          return;
        }

        default: {
          logger.error(new RainbowError('Unknown error checking keychain rainbowPrivateKey'), {
            selectedAddress,
          });
          ErrorAlert();
          return;
        }
      }
    }

    if (!pkey.value) {
      logger.error(new RainbowError('Unable to retrieve value for rainbowPrivateKey'), {
        selectedAddress,
      });
      ErrorAlert();
      return;
    }

    const { address, privateKey } = JSON.parse(pkey.value);
    if (!privateKey || selectedAddress.value !== address) {
      return onFailure();
    }

    onSuccess();
  }, [isChecking, onSuccess, onFailure]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet testID="check-identifier-sheet" backgroundColor={backgroundColor as string} customHeight={sheetHeight}>
          <Inset horizontal={'24px'} vertical={'44px'}>
            <Inset bottom={'44px'} horizontal={'16px'}>
              <Stack alignHorizontal="center">
                <Box
                  as={ImgixImage}
                  height={{ custom: 48 }}
                  marginLeft={{ custom: 0 }}
                  marginRight={{ custom: 0 }}
                  marginTop={{ custom: 0 }}
                  marginBottom={{ custom: 20 }}
                  source={RestoreYourWallet as Source}
                  width={{ custom: imageSize }}
                  size={imageSize}
                />
                <Stack space="24px">
                  <Text align="center" size="26pt" weight="bold" color="label">
                    {lang.t(lang.l.check_identifier.title)}
                  </Text>
                  <Text align="center" size="15pt" weight="semibold" color="labelTertiary">
                    {lang.t(lang.l.check_identifier.description)}
                  </Text>
                </Stack>
              </Stack>
            </Inset>

            <Bleed horizontal="24px">
              <Separator color="separatorSecondary" thickness={1} />
            </Bleed>

            <ButtonPressAnimation scaleTo={0.95} onPress={initAndRunKeychainChecks}>
              <Box alignItems="center" justifyContent="center" paddingTop={'24px'} paddingBottom={'24px'}>
                <Box alignItems="center" justifyContent="center" width="full">
                  <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
                    <Text color={'action (Deprecated)'} size="20pt" weight="bold">
                      {lang.t(lang.l.check_identifier.action)}
                    </Text>
                  </Inline>
                </Box>
              </Box>
            </ButtonPressAnimation>

            <Bleed horizontal="24px">
              <Separator color="separatorSecondary" thickness={1} />
            </Bleed>

            <ButtonPressAnimation scaleTo={0.95} onPress={onMaybeLater}>
              <Box alignItems="center" justifyContent="center" paddingTop={'24px'} paddingBottom={'24px'}>
                <Box alignItems="center" justifyContent="center" width="full">
                  <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
                    <Text color={'labelSecondary'} size="20pt" weight="bold">
                      {lang.t(lang.l.check_identifier.dismiss)}
                    </Text>
                  </Inline>
                </Box>
              </Box>
            </ButtonPressAnimation>

            <Bleed horizontal="24px">
              <Separator color="separatorSecondary" thickness={1} />
            </Bleed>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
