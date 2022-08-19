import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import RainbowGrid from '../../assets/discover-profiles-card.png';
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import { ensAvatarUrl } from '../ens-registration/IntroMarquee/IntroMarquee';
import ImgixImage from '../images/ImgixImage';
import { enableActionsOnReadOnlyWallet } from '@/config';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Cover,
  Heading,
  Inset,
  Stack,
  Text,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import {
  prefetchENSAvatar,
  prefetchENSRecords,
  useAccountENSDomains,
  useWallets,
} from '@rainbow-me/hooks';
import { ensIntroMarqueeNames } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { watchingAlert } from '@rainbow-me/utils';

const CARD_BORDER_WIDTH = 0.25;

export default function ENSCreateProfileCard() {
  const { colorMode } = useColorMode();
  const { navigate } = useNavigation();
  const { isReadOnlyWallet } = useWallets();

  const cardShadow = useMemo(
    () => ({
      custom: {
        android: {
          elevation: 24,
          opacity: 0.5,
        },
        ios: [
          {
            blur: 24,
            offset: { x: 0, y: 8 },
            opacity: colorMode === 'dark' ? 0.3 : 0.1,
          },
          {
            blur: 6,
            offset: { x: 0, y: 2 },
            opacity: 0.02,
          },
        ],
      },
    }),
    [colorMode]
  );

  const cardStyle = useMemo(
    () => ({
      borderColor: `rgba(0, 0, 0, ${colorMode === 'dark' ? '0' : '0.1'})`,
      borderWidth: CARD_BORDER_WIDTH,
      overflow: 'hidden' as const,
    }),
    [colorMode]
  );

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.REGISTER_ENS_NAVIGATOR, {
        fromDiscover: true,
      });
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate]);

  const { uniqueDomain } = useAccountENSDomains();

  useEffect(() => {
    if (uniqueDomain?.name) {
      prefetchENSAvatar(uniqueDomain.name);
      prefetchENSRecords(uniqueDomain.name);
    }
  }, [uniqueDomain]);

  useEffect(() => {
    // Preload intro screen preview marquee ENS images
    ImgixImage.preload(
      ensIntroMarqueeNames.map(name => ({ uri: ensAvatarUrl(name) }))
    );
  }, []);

  const shadow = useForegroundColor('shadow');
  const shadowColor = useForegroundColor({
    custom: {
      dark: shadow,
      light: shadow,
    },
  });

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      scaleTo={0.92}
      style={
        android && {
          paddingBottom: 19,
          paddingHorizontal: 19,
        }
      }
      testID="ens-create-profile-card"
    >
      <AccentColorProvider color={shadowColor}>
        <Box background="body" borderRadius={24} shadow={cardShadow}>
          <AccentColorProvider color="#E8E8E8">
            <Box background="accent" borderRadius={24} style={cardStyle}>
              <Inset space={{ custom: -CARD_BORDER_WIDTH }}>
                <Cover alignHorizontal="center" alignVertical="top">
                  {/* @ts-expect-error JavaScript component */}
                  <Box
                    as={ImgixImage}
                    height={{ custom: 200 }}
                    position="absolute"
                    source={RainbowGrid}
                    width={{ custom: 460 }}
                  />
                </Cover>
                <Inset
                  bottom={{ custom: 24 }}
                  horizontal={{ custom: 20 }}
                  top={{ custom: 100 }}
                >
                  <Columns
                    alignHorizontal="justify"
                    alignVertical="top"
                    space="12px"
                  >
                    <Stack space={{ custom: 13 }}>
                      <Heading color="primary" size="20px" weight="bold">
                        {lang.t('discover.ens_create_profile.title')}
                      </Heading>
                      <Text color="secondary60" size="15px" weight="semibold">
                        {lang.t('discover.ens_create_profile.body')}
                      </Text>
                    </Stack>
                    <Column width="content">
                      <Box width={{ custom: 40 }}>
                        <Heading
                          align="right"
                          color="primary"
                          size="20px"
                          weight="bold"
                        >
                          􀜍
                        </Heading>
                      </Box>
                    </Column>
                  </Columns>
                </Inset>
              </Inset>
            </Box>
          </AccentColorProvider>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}
