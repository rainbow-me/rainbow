import React, { memo } from 'react';
import { Box, Stack, Text, TextIcon, TextShadow, useColorMode } from '@/design-system';
import { USDC_ICON_URL } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { View } from 'react-native';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { ImgixImage } from '@/components/images';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useUserAssetsStore } from '@/state/assets/userAssets';

export const PerpsAccountBalanceCard = memo(function PerpsAccountBalanceCard() {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const balance = useHyperliquidAccountStore(state => state.getBalance());
  const formattedBalance = `${toFixedWorklet(balance, 2)} USDC`;
  const isBalanceZero = Number(balance) === 0;
  const hasNoAssets = useUserAssetsStore(state => !state.getFilteredUserAssetIds().length);

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
              {'AVAILABLE BALANCE'}
            </Text>
            <View style={{ opacity: isBalanceZero ? 0.4 : 1 }}>
              <TextShadow color={accentColors.opacity100} blur={16} shadowOpacity={0.24}>
                <Text color={{ custom: accentColors.opacity100 }} size="17pt" weight="heavy">
                  {formattedBalance}
                </Text>
              </TextShadow>
            </View>
          </Stack>
        </Box>
        {!isBalanceZero && (
          <Box flexDirection="row" gap={10}>
            <ButtonPressAnimation
              onPress={() => {
                Navigation.handleAction(Routes.PERPS_WITHDRAWAL_SCREEN);
              }}
            >
              <Box
                justifyContent="center"
                alignItems="center"
                backgroundColor={accentColors.opacity8}
                height={40}
                width={52}
                borderRadius={24}
                borderWidth={THICKER_BORDER_WIDTH}
                borderColor={{ custom: accentColors.opacity6 }}
              >
                <TextShadow color={accentColors.opacity100} blur={12} shadowOpacity={0.24}>
                  <TextIcon align="center" color={{ custom: accentColors.opacity100 }} size="icon 20px" weight="black">
                    {'􀅽'}
                  </TextIcon>
                </TextShadow>
              </Box>
            </ButtonPressAnimation>
            <HyperliquidButton
              onPress={() => {
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
              {hasNoAssets ? 'Fund Wallet' : 'Deposit'}
            </Text>
          </HyperliquidButton>
        )}
      </Box>
    </Box>
  );
});
