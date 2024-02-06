import { AccentColorProvider, Box, Inline, Stack, Text } from '@/design-system';
import React, { useCallback } from 'react';
import { GenericCard } from './GenericCard';
import { useAccountProfile, useClipboard } from '@/hooks';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '@/components/floating-emojis';
import { useRecoilState } from 'recoil';
import { haptics } from '@/utils';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { analyticsV2 } from '@/analytics';
import { IconOrb } from './reusables/IconOrb';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { TintButton } from './reusables/TintButton';
import Skeleton, { FakeText } from '../skeleton/Skeleton';
import * as i18n from '@/languages';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';

export const RECEIVE_CARD_HEIGHT = 174;
const TRANSLATIONS = i18n.l.cards.receive;

export const ReceiveAssetsCard = () => {
  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();
  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);

  const onPressCopy = useCallback(
    (onNewEmoji: () => void) => {
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

  const onPressQRCode = () => {
    analyticsV2.track(analyticsV2.event.qrCodeViewed, {
      component: 'ReceiveAssetsCard',
    });
    navigate(Routes.RECEIVE_MODAL);
  };

  const { accentColor, loaded: accentColorLoaded } = useAccountAccentColor();

  return (
    <GenericCard type="stretch" disabled={!accentColorLoaded} testID="receive-card">
      <Stack space="36px">
        <Inline alignHorizontal="justify">
          <Stack space="16px">
            {accentColorLoaded ? (
              <Text size="22pt" weight="heavy" color="label">
                {i18n.t(TRANSLATIONS.receive_assets)}
              </Text>
            ) : (
              <Box height={{ custom: 16 }}>
                <Skeleton>
                  <FakeText width={170} height={16} />
                </Skeleton>
              </Box>
            )}
            {accentColorLoaded ? (
              <Box style={{ maxWidth: 210 }}>
                <Text size="15pt" weight="semibold" color="labelSecondary" numberOfLines={2}>
                  {i18n.t(TRANSLATIONS.description)}
                </Text>
              </Box>
            ) : (
              <Box height={{ custom: 30 }} justifyContent="space-between">
                <Skeleton>
                  <FakeText width={200} height={10} />
                </Skeleton>
                <Skeleton>
                  <FakeText width={180} height={10} />
                </Skeleton>
              </Box>
            )}
          </Stack>
          <ButtonPressAnimation onPress={onPressQRCode} scaleTo={0.8} overflowMargin={50}>
            <IconOrb color={accentColor} icon="􀖂" shadowColor="accent" loaded={accentColorLoaded} />
          </ButtonPressAnimation>
        </Inline>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore - JS component */}
        <FloatingEmojis distance={250} duration={500} fadeOut={false} scaleTo={0} size={50} wiggleFactor={0}>
          {({ onNewEmoji }: { onNewEmoji: () => void }) => (
            <AccentColorProvider color={accentColor}>
              <TintButton onPress={() => onPressCopy(onNewEmoji)} height={36} loaded={accentColorLoaded} testID="copy-address-button">
                {`􀐅 ${i18n.t(TRANSLATIONS.copy_address)}`}
              </TintButton>
            </AccentColorProvider>
          )}
        </FloatingEmojis>
      </Stack>
    </GenericCard>
  );
};
