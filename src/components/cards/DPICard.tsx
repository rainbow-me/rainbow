import lang from 'i18n-js';
import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { analytics } from '@/analytics';
import {
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Stack,
  Text,
} from '@/design-system';
import { useAccountSettings } from '@/hooks';
import store from '@/redux/store';
import { DPI_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { ethereumUtils } from '@/utils';
import { GenericCard } from './GenericCard';

export const DPICard = () => {
  const { nativeCurrency } = useAccountSettings();
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    const asset = ethereumUtils.formatGenericAsset(
      store.getState().data?.genericAssets?.[DPI_ADDRESS],
      nativeCurrency
    );

    analytics.track('Pressed DPI Button', { category: 'discover' });

    navigate(Routes.TOKEN_INDEX_SHEET, {
      asset,
      backgroundOpacity: 1,
      cornerRadius: 39,
      fromDiscover: true,
      type: 'token_index',
    });
  }, [nativeCurrency, navigate]);

  return (
    <GenericCard
      gradient={['#6D58F5', '#A970FF']}
      color="#8D65FA"
      onPress={handlePress}
      testID="dpi-button"
      type="stretch"
    >
      <ColorModeProvider value="darkTinted">
        <Stack space="36px">
          <Columns space="20px">
            <Column>
              <Stack space="16px">
                <Text size="22pt" weight="heavy" color="label">
                  {lang.t('discover.dpi.title')}
                </Text>
                <Text size="15pt" weight="semibold" color="labelSecondary">
                  {lang.t('discover.dpi.body')}
                </Text>
              </Stack>
            </Column>
            <Column width="content">
              {/* @ts-expect-error JavaScript component */}
              <CoinIcon
                address={DPI_ADDRESS}
                forcedShadowColor={colors.shadowBlack}
                shadowOpacity={0.1}
                size={36}
                symbol="DPI"
              />
            </Column>
          </Columns>
          <ButtonPressAnimation onPress={handlePress} scaleTo={0.92}>
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
                {`􀦌 ${lang.t('discover.dpi.view')}`}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Stack>
      </ColorModeProvider>
    </GenericCard>
  );
};
