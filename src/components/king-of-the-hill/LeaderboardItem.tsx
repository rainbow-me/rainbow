import { ButtonPressAnimation } from '@/components/animations';
import { RainbowImage } from '@/components/RainbowImage';
import { Inline, Text, useColorMode } from '@/design-system';
import { Token } from '@/graphql/__generated__/metadata';
import { getSizedImageUrl } from '@/handlers/imgix';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import FireIcon from './FireIcon';

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
    overflow: 'hidden',
  },
  rankingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
});

const darkColorsByRank = {
  2: ['#AEAEAE', '#444'],
  3: ['#A68152', '#572302'],
  4: ['rgba(255, 255, 255, 0.1)', 'labelTertiary'],
  5: ['rgba(255, 255, 255, 0.04)', 'labelTertiary'],
} as const;

const lightColorsByRank = {
  2: darkColorsByRank[2].toReversed(),
  3: darkColorsByRank[3].toReversed(),
  4: ['rgba(0, 0, 0, 0.1)', 'labelTertiary'],
  5: ['rgba(0, 0, 0, 0.04)', 'labelTertiary'],
} as const;

const getRankingStyle = (ranking: number, isDarkMode: boolean) => {
  const colorsByRank = isDarkMode ? darkColorsByRank : lightColorsByRank;

  switch (ranking) {
    case 2:
    case 3:
    case 4:
      return {
        backgroundColor: colorsByRank[ranking],
        textColor: colorsByRank[ranking],
      };
    default:
      return {
        backgroundColor: colorsByRank[5],
        textColor: colorsByRank[5],
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
      <View
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'space-between' }}
      >
        {/* icon */}
        <View style={{ width: 40 }}>{iconUrl && <RainbowImage source={{ url: iconUrl }} style={styles.tokenIcon} />}</View>

        {/* info */}
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
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

          {/* Rank, VOL | MCAP */}
          <View style={{ marginTop: 7 }}>
            <Inline alignVertical="center" space="8px">
              <View style={[styles.rankingBadge, { backgroundColor: rankingStyle.backgroundColor }]}>
                <Text
                  color={
                    rankingStyle.textColor === 'labelSecondary' || rankingStyle.textColor === 'labelTertiary'
                      ? rankingStyle.textColor
                      : { custom: rankingStyle.textColor }
                  }
                  size="11pt"
                  weight="bold"
                  align="center"
                >
                  {ranking === 1 ? '1ST' : ranking === 2 ? '2ND' : ranking === 3 ? '3RD' : `${ranking}TH`}
                </Text>
              </View>
              <Text color="labelTertiary" size="11pt" weight="medium">
                VOL {volume} | MCAP {marketCap}
              </Text>
            </Inline>
          </View>
        </View>

        {/* Price */}
        <View>
          <Text color="label" size="17pt" weight="bold" align="right">
            {price}
          </Text>
        </View>
      </View>
    </ButtonPressAnimation>
  );
}
