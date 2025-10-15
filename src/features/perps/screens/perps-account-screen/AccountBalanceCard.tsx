import React, { memo } from 'react';
import { Box, Stack, Text, TextIcon, TextShadow, useColorMode } from '@/design-system';
import { USDC_ICON_URL } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { View } from 'react-native';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { ImgixImage } from '@/components/images';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import i18n from '@/languages';
import { checkIfReadOnlyWallet, useWalletsStore } from '@/state/wallets/walletsStore';

export const PerpsAccountBalanceCard = memo(function PerpsAccountBalanceCard() {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const isBalanceZero = useHyperliquidAccountStore(state => Number(state.getBalance()) === 0);
  const hasNoAssets = useUserAssetsStore(state => !state.getFilteredUserAssetIds().length);
  const accountAddress = useWalletsStore(state => state.accountAddress);

  return (
    <Box
      backgroundColor={isDarkMode ? accentColors.surfacePrimary : 'white'}
      padding={'12px'}
      borderRadius={110}
      borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : 0}
      borderColor={{ custom: accentColors.opacity6 }}
      shadow={'18px'}
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Box flexDirection="row" alignItems="center" gap={12}>
          <ImgixImage enableFasterImage source={{ uri: USDC_ICON_URL }} size={40} style={{ width: 40, height: 40 }} />
          <Stack space={'10px'}>
            <Text color="labelSecondary" size="11pt" weight="heavy">
              {i18n.perps.account.available_balance().toUpperCase()}
            </Text>
            <View style={{ opacity: isBalanceZero ? 0.4 : 1 }}>
              <AccountBalance accentColor={accentColors.opacity100} />
            </View>
          </Stack>
        </Box>
        {!isBalanceZero && (
          <Box flexDirection="row" gap={10}>
            <ButtonPressAnimation
              onPress={() => {
                if (checkIfReadOnlyWallet(accountAddress)) return;
                Navigation.handleAction(Routes.PERPS_WITHDRAWAL_SCREEN);
              }}
            >
              <Box
                justifyContent="center"
                alignItems="center"
                backgroundColor={isDarkMode ? accentColors.opacity8 : accentColors.opacity10}
                height={40}
                width={52}
                borderRadius={24}
                borderWidth={THICKER_BORDER_WIDTH}
                borderColor={{ custom: isDarkMode ? accentColors.opacity6 : accentColors.opacity3 }}
              >
                <TextIcon align="center" color={{ custom: accentColors.opacity100 }} size="icon 20px" weight="black">
                  {'􀅽'}
                </TextIcon>
                {/* TODO: The TextShadow is not working properly with the TextIcon component specifically */}
                {/* <TextShadow color={accentColors.opacity100} blur={12} shadowOpacity={0.24}>
                  <TextIcon align="center" color={{ custom: accentColors.opacity100 }} size="icon 20px" weight="black">
                    {'􀅽'}
                  </TextIcon>
                </TextShadow> */}
              </Box>
            </ButtonPressAnimation>
            <HyperliquidButton
              onPress={() => {
                if (checkIfReadOnlyWallet(accountAddress)) return;
                Navigation.handleAction(Routes.PERPS_DEPOSIT_SCREEN);
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
            </HyperliquidButton>
          </Box>
        )}
        {isBalanceZero && (
          <HyperliquidButton
            onPress={() => {
              if (checkIfReadOnlyWallet(accountAddress)) return;
              if (hasNoAssets) {
                Navigation.handleAction(Routes.ADD_CASH_SHEET);
              } else {
                Navigation.handleAction(Routes.PERPS_DEPOSIT_SCREEN);
              }
            }}
            paddingHorizontal={'16px'}
            paddingVertical={'12px'}
            borderRadius={24}
            height={40}
          >
            <Text color={isDarkMode ? 'black' : 'white'} size={hasNoAssets ? '17pt' : '20pt'} weight="black">
              {hasNoAssets ? i18n.perps.actions.fund_wallet() : i18n.perps.deposit.title()}
            </Text>
          </HyperliquidButton>
        )}
      </Box>
    </Box>
  );
});

const AccountBalance = ({ accentColor }: { accentColor: string }) => {
  const balance = useHyperliquidAccountStore(state => state.getBalance());
  return (
    <TextShadow blur={16} color={accentColor} shadowOpacity={0.24}>
      <Text color={{ custom: accentColor }} size="17pt" weight="heavy">
        {formatCurrency(balance)}
      </Text>
    </TextShadow>
  );
};
