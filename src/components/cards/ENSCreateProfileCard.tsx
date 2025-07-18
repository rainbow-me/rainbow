import { analytics } from '@/analytics';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { Bleed, Box, ColorModeProvider, Column, Columns, Stack, Text } from '@/design-system';
import { prefetchENSAvatar, prefetchENSRecords, useAccountENSDomains, useDimensions } from '@/hooks';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { watchingAlert } from '@/utils';
import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import ENSAvatarGrid from '../../assets/ensAvatarGrid.png';
import ENSIcon from '../../assets/ensIcon.png';
import { useNavigation } from '../../navigation/Navigation';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import ImgixImage from '../images/ImgixImage';
import { GenericCard, Gradient } from './GenericCard';
import { ORB_SIZE } from './reusables/IconOrb';

const ASPECT_RATIO = 112 / 350;
const ARBITRARILY_LARGE_NUMBER = 1000;
const TRANSLATIONS = i18n.l.cards.ens_create_profile;
const GRADIENT: Gradient = {
  colors: ['#DADEE5', '#E6E9F0'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
};

export const ENSCreateProfileCard = () => {
  const { navigate } = useNavigation();
  const { width: deviceWidth } = useDimensions();
  const { name: routeName } = useRoute();
  const cardType = 'stretch';

  // 40 represents the horizontal padding outside the card
  const imageWidth = deviceWidth - 40;

  const { uniqueDomain } = useAccountENSDomains();

  const handlePress = useCallback(() => {
    if (!getIsReadOnlyWallet() || enableActionsOnReadOnlyWallet) {
      if (uniqueDomain?.name) {
        prefetchENSAvatar(uniqueDomain.name);
        prefetchENSRecords(uniqueDomain.name);
      }

      analytics.track(analytics.event.cardPressed, {
        cardName: 'ENSCreateProfileCard',
        routeName,
        cardType,
      });
      navigate(Routes.REGISTER_ENS_NAVIGATOR);
    } else {
      watchingAlert();
    }
  }, [navigate, routeName, uniqueDomain?.name]);

  return (
    <ColorModeProvider value="lightTinted">
      <GenericCard gradient={GRADIENT} onPress={handlePress} testID="ens-create-profile-card" type={cardType}>
        <Stack space="28px">
          <Columns>
            <Column>
              <Stack space={{ custom: 14 }}>
                <Text weight="heavy" color="label" size="20pt">
                  {i18n.t(TRANSLATIONS.title)}
                </Text>
                <Text weight="semibold" color="labelSecondary" size="15pt">
                  {i18n.t(TRANSLATIONS.body)}
                </Text>
              </Stack>
            </Column>
            <Column width="content">
              <Box alignItems="center" width={{ custom: ORB_SIZE }} height={{ custom: ORB_SIZE }}>
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
