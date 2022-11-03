import React, { useCallback, useEffect } from 'react';
import ENSAvatarGrid from '../../assets/ensAvatarGrid.png';
import ENSIcon from '../../assets/ensIcon.png';
import { useNavigation } from '../../navigation/Navigation';
import { ensAvatarUrl } from '../ens-registration/IntroMarquee/IntroMarquee';
import ImgixImage from '../images/ImgixImage';
import { enableActionsOnReadOnlyWallet } from '@/config';
import {
  Bleed,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Stack,
  Text,
} from '@/design-system';
import {
  prefetchENSAvatar,
  prefetchENSRecords,
  useAccountENSDomains,
  useDimensions,
  useWallets,
} from '@/hooks';
import { ensIntroMarqueeNames } from '@/references';
import Routes from '@/navigation/routesNames';
import { watchingAlert } from '@/utils';
import { GenericCard } from './GenericCard';
import { ORB_SIZE } from './reusables/IconOrb';
import * as i18n from '@/languages';

const ASPECT_RATIO = 112 / 350;
const ARBITRARILY_LARGE_NUMBER = 1000;

export const ENSCreateProfileCard = () => {
  const { navigate } = useNavigation();
  const { isReadOnlyWallet } = useWallets();
  const { width: deviceWidth } = useDimensions();

  // 40 represents the horizontal padding outside the card
  const imageWidth = deviceWidth - 40;

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

  const translations = i18n.l.cards.ens_create_profile;

  return (
    <ColorModeProvider value="lightTinted">
      <GenericCard
        gradient={['#DADEE5', '#E6E9F0']}
        onPress={handlePress}
        testID="ens-create-profile-card"
        type="stretch"
      >
        <Stack space="28px">
          <Columns>
            <Column>
              <Stack space={{ custom: 14 }}>
                <Text weight="heavy" color="label" size="20pt">
                  {i18n.t(translations.title)}
                </Text>
                <Text weight="semibold" color="labelSecondary" size="15pt">
                  {i18n.t(translations.body)}
                </Text>
              </Stack>
            </Column>
            <Column width="content">
              <Box
                alignItems="center"
                width={{ custom: ORB_SIZE }}
                height={{ custom: ORB_SIZE }}
              >
                {/* @ts-expect-error JavaScript component */}
                <Box
                  as={ImgixImage}
                  marginTop="-12px"
                  source={ENSIcon}
                  // doing some weird stuff here to fit the image into a properly sized container
                  width={{ custom: ORB_SIZE * 2 }}
                  height={{ custom: ORB_SIZE * 2 }}
                />
              </Box>
            </Column>
          </Columns>
          <Bleed horizontal="20px">
            <Box
              paddingTop="10px"
              height={{ custom: imageWidth * ASPECT_RATIO }}
              width={{ custom: imageWidth }}
              alignItems="center"
              justifyContent="center"
            >
              {/* @ts-expect-error JavaScript component */}
              <Box
                as={ImgixImage}
                alignItems="center"
                resizeMode="contain"
                width={{ custom: imageWidth }}
                // doing some weird stuff here to fit the image into a properly sized container
                height={{ custom: ARBITRARILY_LARGE_NUMBER }}
                source={ENSAvatarGrid}
              />
            </Box>
          </Bleed>
        </Stack>
      </GenericCard>
    </ColorModeProvider>
  );
};
