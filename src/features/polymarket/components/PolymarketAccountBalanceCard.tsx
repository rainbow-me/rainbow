import React, { memo } from 'react';
import { Box, Stack, Text, TextIcon, TextShadow, useColorMode } from '@/design-system';
import { USDC_ICON_URL } from '@/features/perps/constants';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { View } from 'react-native';
import { ImgixImage } from '@/components/images';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import * as i18n from '@/languages';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { opacity } from '@/framework/ui/utils/opacity';
import { PolymarketButton } from '@/features/polymarket/components/PolymarketButton';

export const PolymarketAccountBalanceCard = memo(function PolymarketAccountBalanceCard({ accentColor }: { accentColor: string }) {
  const { isDarkMode } = useColorMode();
  const isBalanceZero = usePolymarketBalanceStore(state => state.isBalanceZero());
  const balance = usePolymarketBalanceStore(state => state.getBalance());
  const hasNoAssets = useUserAssetsStore(state => !state.getFilteredUserAssetIds().length);

  return (
    <Box
      backgroundColor={isDarkMode ? '#1C0D20' : 'white'}
      padding={'12px'}
      height={64}
      borderRadius={110}
      borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : 0}
      borderColor={{ custom: opacity(accentColor, 0.16) }}
      shadow={'18px'}
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Box flexDirection="row" alignItems="center" gap={12}>
          <ImgixImage enableFasterImage source={{ uri: USDC_ICON_URL }} size={40} style={{ width: 40, height: 40 }} />
          <Stack space={'10px'}>
            <Text color="labelSecondary" size="11pt" weight="heavy">
              {i18n.t(i18n.l.perps.account.available_balance).toUpperCase()}
            </Text>
            <View style={{ opacity: isBalanceZero ? 0.4 : 1 }}>
              <TextShadow blur={16} color={accentColor} shadowOpacity={0.24}>
                <Text color={'label'} size="17pt" weight="heavy">
                  {formatCurrency(balance)}
                </Text>
              </TextShadow>
            </View>
          </Stack>
        </Box>
        {!isBalanceZero && (
          <Box flexDirection="row" gap={10}>
            <ButtonPressAnimation
              onPress={() => {
                if (getIsReadOnlyWallet()) return;
                Navigation.handleAction(Routes.POLYMARKET_WITHDRAWAL_SCREEN);
              }}
            >
              <Box
                justifyContent="center"
                alignItems="center"
                backgroundColor={isDarkMode ? opacity(accentColor, 0.08) : opacity(accentColor, 0.1)}
                height={40}
                width={52}
                borderRadius={24}
                borderWidth={THICKER_BORDER_WIDTH}
                borderColor={{ custom: isDarkMode ? opacity(accentColor, 0.06) : opacity(accentColor, 0.03) }}
              >
                <TextIcon align="center" color={{ custom: accentColor }} size="icon 20px" weight="black">
                  {'􀅽'}
                </TextIcon>
              </Box>
            </ButtonPressAnimation>
            <PolymarketButton
              onPress={() => {
                if (getIsReadOnlyWallet()) return;
                Navigation.handleAction(Routes.POLYMARKET_DEPOSIT_SCREEN);
              }}
              height={40}
              width={52}
              paddingHorizontal={'16px'}
              paddingVertical={'12px'}
              borderRadius={24}
              borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : 0}
            >
              <TextIcon color={isDarkMode ? 'black' : 'white'} size="icon 20px" weight="black">
                {'􀅼'}
              </TextIcon>
            </PolymarketButton>
          </Box>
        )}
        {isBalanceZero && (
          <PolymarketButton
            onPress={() => {
              if (getIsReadOnlyWallet()) return;
              if (hasNoAssets) {
                Navigation.handleAction(Routes.ADD_CASH_SHEET);
              } else {
                Navigation.handleAction(Routes.POLYMARKET_DEPOSIT_SCREEN);
              }
            }}
            paddingHorizontal={'16px'}
            paddingVertical={'12px'}
            borderRadius={24}
            height={40}
          >
            <Text color={isDarkMode ? 'black' : 'white'} size={hasNoAssets ? '17pt' : '20pt'} weight="black">
              {hasNoAssets ? i18n.t(i18n.l.perps.actions.fund_wallet) : i18n.t(i18n.l.perps.deposit.title)}
            </Text>
          </PolymarketButton>
        )}
      </Box>
    </Box>
  );
});
