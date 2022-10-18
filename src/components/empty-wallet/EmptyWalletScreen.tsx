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
import React from 'react';
import lang from 'i18n-js';
import LearnCard from '../cards/LearnCard';
import { Linking } from 'react-native';
import ReceiveAssetsCard from '../cards/ReceiveAssetsCard';

const EmptyWalletScreen = () => {
  return (
    <Inset horizontal="20px">
      <Stack space="20px">
        <Box width="full" height={{ custom: 200 }} />
        <Inline space="20px">
          <LearnCard
            onPress={() =>
              Linking.openURL('https://learn.rainbow.me/avoid-crypto-scams')
            }
            gradient={['#FF5CA0', '#FF70B3']}
            accentColor={globalColors.pink20}
            emoji="🤬"
            title={lang.t('cards.learn.titles.avoid_scams')}
            category={lang.t('cards.learn.categories.staying_safe')}
          />
          <LearnCard
            onPress={() =>
              Linking.openURL(
                'https://learn.rainbow.me/connect-to-a-websiteapp'
              )
            }
            gradient={['#5F5AFA', '#9585FF']}
            accentColor={globalColors.purple20}
            emoji="🔌"
            title={lang.t('cards.learn.titles.get_started')}
            category={lang.t('cards.learn.categories.essentials')}
          />
        </Inline>
        <ReceiveAssetsCard
          accentColor={globalColors.purple20}
          emoji="🔌"
          title={lang.t('cards.learn.titles.get_started')}
          category={lang.t('cards.learn.categories.essentials')}
        />
      </Stack>
    </Inset>
  );
};

export default EmptyWalletScreen;
