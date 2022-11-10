import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { analyticsV2 } from '@/analytics';
import {
  Box,
  ColorModeProvider,
  Column,
  Columns,
  globalColors,
  Stack,
  Text,
} from '@/design-system';
import { useAccountSettings } from '@/hooks';
import store from '@/redux/store';
import { DPI_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';
import { GenericCard } from './GenericCard';
import { ORB_SIZE } from './reusables/IconOrb';
import { useRoute } from '@react-navigation/native';

const TRANSLATIONS = i18n.l.cards.dpi;

export const DPICard = () => {
  const { nativeCurrency } = useAccountSettings();
  const { navigate } = useNavigation();
  const { name: routeName } = useRoute();
  const cardType = 'stretch';

  const handlePress = useCallback(() => {
    const asset = ethereumUtils.formatGenericAsset(
      store.getState().data?.genericAssets?.[DPI_ADDRESS],
      nativeCurrency
    );

    analyticsV2.track(analyticsV2.event.cardPressed, {
      cardName: 'DPICard',
      routeName,
      cardType,
    });

    navigate(Routes.TOKEN_INDEX_SHEET, {
      asset,
      backgroundOpacity: 1,
      cornerRadius: 39,
      fromDiscover: true,
      type: 'token_index',
    });
  }, [nativeCurrency, navigate, routeName]);

  return (
    <ColorModeProvider value="darkTinted">
      <GenericCard
        gradient={['#6D58F5', '#A970FF']}
        color="#8D65FA"
        onPress={handlePress}
        testID="dpi-button"
        type={cardType}
      >
        <Stack space="36px">
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
              {/* @ts-expect-error JavaScript component */}
              <CoinIcon
                address={DPI_ADDRESS}
                forcedShadowColor={globalColors.grey100}
                shadowOpacity={0.1}
                size={ORB_SIZE}
                symbol="DPI"
              />
            </Column>
          </Columns>
          <ButtonPressAnimation
            onPress={handlePress}
            scaleTo={0.92}
            overflowMargin={50}
          >
            <Box
              as={LinearGradient}
              colors={['#5236C2', '#7533D6']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0.5 }}
              background="accent"
              borderRadius={99}
              height="36px"
              width="full"
              alignItems="center"
              justifyContent="center"
              shadow="18px"
            >
              <Text color="label" containsEmoji size="15pt" weight="bold">
                {`􀦌 ${i18n.t(TRANSLATIONS.view)}`}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Stack>
      </GenericCard>
    </ColorModeProvider>
  );
};
