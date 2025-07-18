import React from 'react';
import { Box, Inline, Stack, Text, useColorMode } from '@/design-system';
import FastImage from 'react-native-fast-image';
import { getSizedImageUrl } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import FireIcon from './FireIcon';
import { StyleSheet } from 'react-native';
import { Token } from '@/graphql/__generated__/metadata';

interface LeaderboardItemProps {
  token: Token;
  ranking: number;
  priceChange: string;
  volume: string;
  marketCap: string;
  price: string;
}

const styles = StyleSheet.create({
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
});

const getRankingStyle = (ranking: number, isDarkMode: boolean) => {
  switch (ranking) {
    case 1:
      return {
        backgroundColor: '#FFD700',
        textColor: 'labelSecondary' as const,
      };
    case 2:
      return {
        backgroundColor: isDarkMode ? '#C0C0C0' : '#E5E5E5',
        textColor: 'labelSecondary' as const,
      };
    case 3:
      return {
        backgroundColor: isDarkMode ? '#CD7F32' : '#FFE4B5',
        textColor: isDarkMode ? '#8B4513' : '#CD7F32',
      };
    default:
      return {
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
        textColor: 'labelTertiary' as const,
      };
  }
};

export function LeaderboardItem({ token, ranking, priceChange, volume, marketCap, price }: LeaderboardItemProps) {
  const { isDarkMode } = useColorMode();
  const rankingStyle = getRankingStyle(ranking, isDarkMode);
  const iconUrl = getSizedImageUrl(token.iconUrl, 80);

  const handlePress = () => {
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: token,
      address: token.address,
      chainId: token.chainId,
    });
  };

  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={0.96}>
      <Box flexDirection="row" alignItems="center" paddingVertical="12px" paddingHorizontal="20px" justifyContent="space-between">
        {/* Left side: Token icon */}
        <Box width={{ custom: 40 }}>
          <FastImage source={{ uri: iconUrl }} style={styles.tokenIcon} />
        </Box>

        {/* Middle: Token info */}
        <Box flex={1} paddingHorizontal="12px">
          <Stack space="4px">
            {/* Top row: Name, Fire icon, Price change */}
            <Inline alignVertical="center" space="6px">
              <Text color="label" size="15pt" weight="semibold" numberOfLines={1}>
                {token.name}
              </Text>
              <FireIcon size={14} />
              <Text color={priceChange.startsWith('+') ? 'green' : 'red'} size="13pt" weight="semibold">
                {priceChange}
              </Text>
            </Inline>

            {/* Bottom row: Ranking badge, VOL | MCAP */}
            <Inline alignVertical="center" space="8px">
              <Box style={[styles.rankingBadge, { backgroundColor: rankingStyle.backgroundColor }]}>
                <Text 
                  color={rankingStyle.textColor === 'labelSecondary' || rankingStyle.textColor === 'labelTertiary' ? rankingStyle.textColor : { custom: rankingStyle.textColor }} 
                  size="11pt" 
                  weight="bold" 
                  align="center"
                >
                  {ranking === 1 ? '1ST' : ranking === 2 ? '2ND' : ranking === 3 ? '3RD' : `${ranking}TH`}
                </Text>
              </Box>
              <Text color="labelTertiary" size="11pt" weight="medium">
                VOL {volume} | MCAP {marketCap}
              </Text>
            </Inline>
          </Stack>
        </Box>

        {/* Right side: Price */}
        <Box>
          <Text color="label" size="18px" weight="bold" align="right">
            {price}
          </Text>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
}
