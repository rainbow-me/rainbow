import { AccentColorProvider, Box, Inline, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';
import React, { useCallback } from 'react';
import { GenericCard } from './GenericCard';
import { useAccountProfile, useClipboard } from '@/hooks';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '@/components/floating-emojis';
import { useRecoilState } from 'recoil';
import { addressCopiedToastAtom } from '@/screens/WalletScreen';
import { haptics } from '@/utils';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analytics } from '@/analytics';
import { IconOrb } from './IconOrb';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';

export const ReceiveCardHeight = 174;

export const ReceiveAssetsCard = () => {
  const { colors } = useTheme();
  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();
  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );

  const onPressCopy = useCallback(
    onNewEmoji => {
      if (!isToastActive) {
        setToastActive(true);
        setTimeout(() => {
          setToastActive(false);
        }, 2000);
      }
      haptics.notificationSuccess();
      onNewEmoji();
      setClipboard(accountAddress);
    },
    [accountAddress, isToastActive, setClipboard, setToastActive]
  );

  const onPressQRCode = useCallback(() => {
    analytics.track('Tapped "My QR Code"', {
      category: 'ReceiveAssetsCard',
    });
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate]);

  const { accentColor } = useAccountAccentColor();

  return (
    <GenericCard type="stretch">
      <Stack space="36px">
        <Inline alignHorizontal="justify">
          <Stack space="16px">
            <Text size="22pt" weight="heavy" color="label">
              Receive Assets
            </Text>
            <Text size="15pt" weight="semibold" color="labelSecondary">
              {'You can also long press your\naddress above to copy it.'}
            </Text>
          </Stack>
          <ButtonPressAnimation onPress={onPressQRCode} scaleTo={0.8}>
            <IconOrb color={accentColor} icon="􀖂" shadowColor="accent" />
          </ButtonPressAnimation>
        </Inline>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore - JS component */}
        <FloatingEmojis
          distance={250}
          duration={500}
          fadeOut={false}
          scaleTo={0}
          size={50}
          wiggleFactor={0}
        >
          {({ onNewEmoji }: { onNewEmoji: () => void }) => (
            <ButtonPressAnimation onPress={() => onPressCopy(onNewEmoji)}>
              <AccentColorProvider color={colors.alpha(accentColor, 0.1)}>
                <Box
                  background="accent"
                  borderRadius={99}
                  height="36px"
                  width="full"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color={{ custom: accentColor }}
                    containsEmoji
                    size="15pt"
                    weight="bold"
                  >
                    􀐅 Copy Address
                  </Text>
                </Box>
              </AccentColorProvider>
            </ButtonPressAnimation>
          )}
        </FloatingEmojis>
      </Stack>
    </GenericCard>
  );
};
