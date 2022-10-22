import {
  Box,
  ColorModeProvider,
  globalColors,
  Inline,
  Inset,
  Row,
  Rows,
  Stack,
} from '@/design-system';
import React, { useCallback } from 'react';
import lang from 'i18n-js';
import LearnCard from '../cards/LearnCard';
import { Linking } from 'react-native';
import ReceiveAssetsCard from '../cards/ReceiveAssetsCard';
import { cardColorways, learnCards } from '../cards/constants';
import ActionCard from '../cards/ActionCard';
import {
  useAccountProfile,
  useExpandedStateNavigation,
  useWallets,
} from '@/hooks';
import showWalletErrorAlert from '@/helpers/support';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { IS_IOS } from '@/env';
import { useRoute } from '@react-navigation/native';
import config from '@/model/config';
import { analytics } from '@/analytics';
import { useTheme } from '@/theme';

const EmptyWalletScreen = () => {
  const { isDamaged } = useWallets();
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountProfile();
  const { params } = useRoute();
  const { isDarkMode } = useTheme();

  const onPressBuy = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (!config.wyre_enabled) {
      navigate(Routes.EXPLAIN_SHEET, { type: 'wyre_degradation' });
      return;
    }

    if (IS_IOS) {
      navigate(Routes.ADD_CASH_FLOW, { params });
    } else {
      navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, () => ({
        params: {
          address: accountAddress,
        },
        screen: Routes.WYRE_WEBVIEW,
      }));
    }

    analytics.track('Tapped Add Cash', {
      category: 'add cash',
      source: 'expanded state',
    });
  }, [accountAddress, isDamaged, navigate]);

  const themedCardColorways = cardColorways(isDarkMode);

  return (
    <Inset horizontal="20px">
      <Stack space="20px">
        <Box width="full" height={{ custom: 200 }} />
        <Inline space="20px">
          <LearnCard cardDetails={learnCards[0]} type="stretch" />
          {/* <LearnCard
            onPress={() =>
              Linking.openURL(
                'https://learn.rainbow.me/connect-to-a-websiteapp'
              )
            }
            gradient={['#5F5AFA', '#9585FF']}
            accentColor={globalColors.purple20}
            shadowColor="purple"
            emoji="🔌"
            title={lang.t('cards.learn.titles.get_started')}
            category={lang.t('cards.learn.categories.essentials')}
          /> */}
        </Inline>
        <Box
          background="blue"
          width="full"
          height={undefined}
          borderRadius={24}
          shadow={{
            custom: {
              android: {
                color: 'shadow',
                elevation: 24,
                opacity: 0.5,
              },
              ios: [
                {
                  blur: 24,
                  color: 'shadow',
                  offset: { x: 0, y: 8 },
                  opacity: 0.35,
                },
              ],
            },
          }}
          padding="20px"
        >
          <Box height={{ custom: 100 }} width="full" />
        </Box>
        <ReceiveAssetsCard />
        <Inline space="20px">
          <ActionCard
            colorway={themedCardColorways.green}
            onPress={onPressBuy}
            title="Buy Crypto with Cash"
            sfSymbolIcon="􀅼"
          />
          <ActionCard
            colorway={themedCardColorways.yellow}
            onPress={() => {}}
            title="Create a token watchlist"
            sfSymbolIcon="􀣩"
          />
        </Inline>
      </Stack>
    </Inset>
  );
};

export default EmptyWalletScreen;
