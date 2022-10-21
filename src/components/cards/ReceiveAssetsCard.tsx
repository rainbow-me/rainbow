import {
  AccentColorProvider,
  Box,
  ColorModeProvider,
  Inline,
  Stack,
  Text,
} from '@/design-system';
import Clipboard from '@react-native-community/clipboard';
import { useTheme } from '@/theme';
import React, { useCallback } from 'react';
import GenericCard from './GenericCard';
import { useAccountProfile } from '@/hooks';
import { ButtonPressAnimation } from '../animations';
import { CopyFloatingEmojis } from '@/components/floating-emojis';
import { useRecoilState } from 'recoil';
import { addressCopiedToastAtom } from '@/screens/WalletScreen';
import { haptics } from '@/utils';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import QRCodeIcon from '@/assets/qrCodeIcon.png';
import { ImgixImage } from '../images';
import useAccountAccentColor from '@/hooks/useAccountAccentColor';

export const ReceiveCardHeight = 174;

const ReceiveAssetsCard = () => {
  const { colors, isDarkMode } = useTheme();
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

  const { accentColor, loaded: accentColorLoaded } = useAccountAccentColor();

  return (
    <GenericCard type="stretch" height={ReceiveCardHeight}>
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
          <AccentColorProvider color={accentColor}>
            <ButtonPressAnimation onPress={onPressQRCode} scaleTo={0.8}>
              <Box
                width={{ custom: 36 }}
                height={{ custom: 36 }}
                borderRadius={18}
                background="accent"
                alignItems="center"
                justifyContent="center"
                shadow={{
                  custom: {
                    android: {
                      color: isDarkMode ? 'shadow' : 'accent',
                      elevation: 24,
                      opacity: 0.5,
                    },
                    ios: [
                      {
                        blur: 24,
                        color: isDarkMode ? 'shadow' : 'accent',
                        offset: { x: 0, y: 8 },
                        opacity: 0.35,
                      },
                    ],
                  },
                }}
              >
                <Box
                  as={ImgixImage}
                  source={QRCodeIcon}
                  height={{ custom: 16 }}
                  width={{ custom: 16 }}
                />
              </Box>
            </ButtonPressAnimation>
          </AccentColorProvider>
        </Inline>
        <AccentColorProvider color={colors.alpha(accentColor, 0.6)}>
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
                <Text
                  color={{ custom: colors.black }}
                  containsEmoji
                  size="15pt"
                  weight="bold"
                >
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
