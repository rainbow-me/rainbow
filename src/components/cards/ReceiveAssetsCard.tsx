import {
  AccentColorProvider,
  Box,
  ColorModeProvider,
  globalColors,
  Inline,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import Clipboard from '@react-native-community/clipboard';
import { useTheme } from '@/theme';
import { Text as NativeText } from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import GenericCard from './GenericCard';
import { Emoji } from '../text';
import { ButtonPressAnimation } from '../animations';
import { useAccountProfile, useWallets } from '@/hooks';
import showWalletErrorAlert from '@/helpers/support';
import { CopyFloatingEmojis } from '@/components/floating-emojis';
import { useRecoilState } from 'recoil';
import { addressCopiedToastAtom } from '@/screens/WalletScreen';
import { haptics } from '@/utils';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';

interface ReceiveAssetsCard {
  emoji: string;
  title: string;
  category: string;
  accentColor: string;
}

const ReceiveAssetsCard = ({
  emoji,
  title,
  category,
  accentColor,
}: ReceiveAssetsCard) => {
  const { colors } = useTheme();
  const blueHex = useForegroundColor('blue');
  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();
  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );

  const onPressCopy = useCallback(() => {
    if (!isToastActive) {
      setToastActive(true);
      setTimeout(() => {
        setToastActive(false);
      }, 2000);
    }
    haptics.notificationSuccess();
    Clipboard.setString(accountAddress);
  }, [accountAddress, isToastActive, setToastActive]);

  const onPressQRCode = useCallback(() => {
    analytics.track('Tapped "My QR Code"', {
      category: 'ReceiveAssetsCard',
    });
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate]);

  return (
    <GenericCard type="stretch" height={174}>
      <Box height="full" justifyContent="space-between">
        <Inline alignHorizontal="justify">
          <Stack space="16px">
            <Text size="22pt" weight="heavy" color="label">
              Receive Assets
            </Text>
            <Text
              size="15pt"
              weight="semibold"
              color="labelSecondary"
              numberOfLines={2}
            >
              {'You can also long press your\naddress above to copy it.'}
            </Text>
          </Stack>
          <AccentColorProvider color={blueHex}>
            <ButtonPressAnimation onPress={onPressQRCode} scaleTo={0.92}>
              <Box
                width={{ custom: 36 }}
                height={{ custom: 36 }}
                borderRadius={18}
                background="blue"
                alignItems="center"
                justifyContent="center"
                shadow={{
                  custom: {
                    android: {
                      color: 'accent',
                      elevation: 24,
                      opacity: 0.5,
                    },
                    ios: [
                      {
                        blur: 24,
                        color: 'accent',
                        offset: { x: 0, y: 8 },
                        opacity: 0.35,
                      },
                    ],
                  },
                }}
              >
                <NativeText style={{ fontSize: 14, paddingLeft: 1 }}>
                  􀖂
                </NativeText>
              </Box>
            </ButtonPressAnimation>
          </AccentColorProvider>
        </Inline>
        <AccentColorProvider color={colors.alpha(blueHex, 0.1)}>
          <CopyFloatingEmojis onPress={onPressCopy} textToCopy={accountAddress}>
            <Box
              background="accent"
              borderRadius={99}
              height={{ custom: 36 }}
              width="full"
              alignItems="center"
              justifyContent="center"
            >
              <ColorModeProvider value="light">
                <Text color="blue" containsEmoji size="15pt" weight="bold">
                  􀐅 Copy Address
                </Text>
              </ColorModeProvider>
            </Box>
          </CopyFloatingEmojis>
        </AccentColorProvider>
      </Box>
    </GenericCard>
  );
};

export default ReceiveAssetsCard;
