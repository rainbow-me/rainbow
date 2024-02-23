import * as i18n from '@/languages';
import React from 'react';
import { useNavigation } from '../../navigation/Navigation';
import { analyticsV2 } from '@/analytics';
import { Box, ColorModeProvider, Column, Columns, Stack, Text } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { GenericCard, Gradient } from './GenericCard';
import { ORB_SIZE } from './reusables/IconOrb';
import { useRoute } from '@react-navigation/native';
import ledgerLogo from '@/assets/ledgerLogo.png';
import { ImgixImage } from '../images';
import ledgerNano from '@/assets/ledger-nano.png';
import { Source } from 'react-native-fast-image';
import { LEDGER_NANO_HEIGHT, LEDGER_NANO_WIDTH } from '@/screens/hardware-wallets/components/NanoXDeviceAnimation';

const TRANSLATIONS = i18n.l.cards.ledger;
const GRADIENT: Gradient = {
  colors: ['#313233', '#3B3C3D'],
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
};
// this is bc the ledger nano image itself is strangely tall
const LEDGER_CONTAINER_HEIGHT = 108;

export const LedgerCard = () => {
  const { navigate } = useNavigation();
  const { name: routeName } = useRoute();
  const cardType = 'stretch';

  const handlePress = () => {
    analyticsV2.track(analyticsV2.event.cardPressed, {
      cardName: 'LedgerCard',
      routeName,
      cardType,
    });
    navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR);
  };

  return (
    <ColorModeProvider value="darkTinted">
      <GenericCard gradient={GRADIENT} onPress={handlePress} testID="ledger-card" type={cardType}>
        <Stack space="28px">
          <Columns space="20px">
            <Column>
              <Stack space={{ custom: 14 }}>
                <Text size="20pt" weight="heavy" color="label">
                  {i18n.t(TRANSLATIONS.title)}
                </Text>
                <Text size="15pt" weight="semibold" color="labelSecondary">
                  {i18n.t(TRANSLATIONS.body)}
                </Text>
              </Stack>
            </Column>
            <Column width="content">
              {/* @ts-ignore */}
              <Box
                as={ImgixImage}
                width={{ custom: ORB_SIZE }}
                height={{ custom: ORB_SIZE }}
                borderRadius={ORB_SIZE / 2}
                shadow="18px"
                source={ledgerLogo}
              />
            </Column>
          </Columns>
          <Box
            height={{ custom: LEDGER_CONTAINER_HEIGHT }}
            width="full"
            justifyContent="center"
            alignItems="center"
            // manually center the image vertically in the container
            paddingBottom="20px"
          >
            <ImgixImage
              source={ledgerNano as Source}
              style={{
                width: LEDGER_NANO_WIDTH,
                height: LEDGER_NANO_HEIGHT,
              }}
              size={LEDGER_NANO_HEIGHT}
            />
          </Box>
        </Stack>
      </GenericCard>
    </ColorModeProvider>
  );
};
