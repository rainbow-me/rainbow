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
import { learnCards } from '../cards/constants';

const EmptyWalletScreen = () => {
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
        <ReceiveAssetsCard />
      </Stack>
    </Inset>
  );
};

export default EmptyWalletScreen;
