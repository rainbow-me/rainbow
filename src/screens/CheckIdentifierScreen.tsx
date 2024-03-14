import React, { useCallback, useState } from 'react';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { logger, RainbowError } from '@/logger';

import styled from '@/styled-thing';
import { fonts, position } from '@/styles';
import { ThemeContextProps } from '@/theme';
import { SheetActionButton, SheetTitle } from '@/components/sheet';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import * as kc from '@/keychain';
import { addressKey } from '@/utils/keychainConstants';
import { Alert } from '@/components/alerts';
import * as i18n from '@/languages';

// @ts-expect-error Our implementation of SC complains
const Container = styled.View({
  ...position.coverAsObject,
  alignItems: 'center',
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) => colors.alpha(colors.white, 0.9),
  justifyContent: 'center',
});

const ErrorAlert = () =>
  Alert({
    buttons: [
      {
        onPress: () => {},
        text: i18n.t(i18n.l.check_identifier.error_alert.contact_support),
      },
      {
        style: 'cancel',
        text: i18n.t(i18n.l.check_identifier.error_alert.cancel),
      },
    ],
    message: i18n.t(i18n.l.check_identifier.error_alert.message),
    title: i18n.t(i18n.l.check_identifier.error_alert.title),
  });

export default function CheckIdentifierScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'CheckIdentifierScreen'>>();

  const { onSuccess, onFailure } = params;

  const [isChecking, setIsChecking] = useState(false);

  useAndroidBackHandler(() => {
    return true;
  });

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
    <Container testID="check-identifier-screen">
      <SheetTitle align="center" lineHeight="big" size={fonts.size.big} weight="heavy">
        {i18n.t(i18n.l.check_identifier.title)}
      </SheetTitle>

      <SheetActionButton label="Authenticate" onPress={initAndRunKeychainChecks} testID="check-identifier-screen-action-button" />
    </Container>
  );
}
