import { SheetActionButton } from '@/components/sheet';
import { Bleed, Box, Column, Columns, Inset, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { IS_ANDROID } from '@/env';
import React, { useCallback } from 'react';

import { useNavigation } from '@/navigation';

import WalletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { useWallets } from '@/state/wallets/walletsStore';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

const MIN_HEIGHT = 740;
const isSmallPhone = DEVICE_HEIGHT < MIN_HEIGHT;
const contentHeight = DEVICE_HEIGHT - (!isSmallPhone ? sharedCoolModalTopOffset : 0) - 100;

const SecretWarningPage = () => {
  const wallets = useWallets();
  const { navigate } = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.SECRET_WARNING>>();

  const { walletId, privateKeyAddress, isBackingUp, backupType, title } = params;

  const isSecretPhrase = WalletTypes.mnemonic === wallets?.[walletId]?.type;
  const secretText =
    isSecretPhrase && !privateKeyAddress
      ? i18n.t(i18n.l.back_up.secret.secret_phrase_title)
      : i18n.t(i18n.l.back_up.secret.private_key_title);

  const handleViewSecretPhrase = useCallback(() => {
    navigate(Routes.SHOW_SECRET, {
      title,
      privateKeyAddress,
      isBackingUp,
      backupType,
      walletId,
      secretText,
    });
  }, [navigate, privateKeyAddress, title, secretText, walletId, isBackingUp, backupType]);

  const items: {
    icon: string;
    description: string;
    color: TextColor;
  }[] = [
    {
      icon: '􀇿',
      description: i18n.t(i18n.l.back_up.warning.never_share, {
        typeName: secretText,
      }),
      color: 'orange',
    },
    {
      icon: '􀎥',
      description: i18n.t(i18n.l.back_up.warning.access, {
        typeName: secretText,
      }),
      color: 'red',
    },
    {
      icon: '􀋮',
      description: i18n.t(i18n.l.back_up.warning.hide, {
        typeName: secretText,
      }),
      color: 'pink',
    },
    {
      icon: '􀡦',
      description: i18n.t(i18n.l.back_up.warning.support, {
        typeName: secretText,
      }),
      color: 'blue',
    },
  ];

  return (
    <Box style={{ height: contentHeight }}>
      <Inset horizontal={'24px'} top={'104px'}>
        <Stack space={'44px'}>
          <Stack space={'20px'}>
            <Text align="center" color="orange" size="34pt" weight="bold">
              {isBackingUp ? '􀇿' : '􀉆'}
            </Text>
            <Text align="center" color="label" size="20pt" weight="bold">
              {isBackingUp
                ? i18n.t(i18n.l.back_up.warning.before_you_proceed)
                : i18n.t(i18n.l.back_up.warning.title, {
                    typeName: secretText,
                  })}
            </Text>
          </Stack>
          <Stack space={'36px'}>
            {items.map(item => (
              <Columns key={item.icon} space={{ custom: 13 }}>
                <Column width={{ custom: 50 }}>
                  <Box paddingTop={IS_ANDROID ? '6px' : undefined}>
                    <Text align="center" color={item.color} size="20pt" weight="bold">
                      {item.icon}
                    </Text>
                  </Box>
                </Column>
                <Bleed top="3px">
                  <Stack space="12px">
                    <Text color="labelSecondary" size="15pt" weight="semibold">
                      {item.description}
                    </Text>
                  </Stack>
                </Bleed>
              </Columns>
            ))}
          </Stack>
        </Stack>
      </Inset>

      <Box
        testID={'show-secret-button'}
        position="absolute"
        bottom={{ custom: IS_ANDROID ? 40 : 20 }}
        alignItems="center"
        style={{ paddingHorizontal: 24 }}
      >
        <SheetActionButton
          label={i18n.t(i18n.l.back_up.warning.button, {
            typeName: secretText,
          })}
          color="red"
          weight="bold"
          onPress={handleViewSecretPhrase}
        />
      </Box>
    </Box>
  );
};

export default SecretWarningPage;
