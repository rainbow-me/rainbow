import { ButtonPressAnimation } from '@/components/animations';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { RainbowImage } from '@/components/RainbowImage';
import { Inline, Text, useColorMode } from '@/design-system';
import { Token } from '@/graphql/__generated__/metadata';
import { getSizedImageUrl } from '@/handlers/imgix';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { formatPriceChange, getPriceChangeColor } from './utils';

interface LeaderboardItemProps {
  token: Token;
  ranking: number;
  priceChange?: number | null;
  volume: string;
  marketCap: string;
  price: string;
}

const darkColorsByRank: Record<number, [string, string]> = {
  2: ['#AEAEAE', '#444'],
  3: ['#A68152', '#572302'],
  4: ['rgba(255, 255, 255, 0.1)', 'labelTertiary'],
  5: ['rgba(255, 255, 255, 0.04)', 'labelTertiary'],
};

const lightColorsByRank: Record<number, [string, string]> = {
  2: [darkColorsByRank[2][0], darkColorsByRank[2][1]],
  3: [darkColorsByRank[3][0], darkColorsByRank[3][1]],
  4: ['rgba(0, 0, 0, 0.1)', 'labelTertiary'],
  5: ['rgba(0, 0, 0, 0.04)', 'labelTertiary'],
};

const getRankingStyle = (ranking: number, isDarkMode: boolean) => {
  const colorsByRank = isDarkMode ? darkColorsByRank : lightColorsByRank;

  switch (ranking) {
    case 2:
    case 3:
    case 4:
      return {
        backgroundColor: colorsByRank[ranking][0],
        textColor: colorsByRank[ranking][1],
      };
    default:
      return {
        backgroundColor: colorsByRank[5][0],
        textColor: colorsByRank[5][1],
      };
  }
};

export function LeaderboardItem({ token, ranking, priceChange, volume, marketCap, price }: LeaderboardItemProps) {
  const { isDarkMode } = useColorMode();
  const rankingStyle = getRankingStyle(ranking, isDarkMode);
  const iconUrl = getSizedImageUrl(token.iconUrl, 80);
  const priceChangeString = formatPriceChange(priceChange);
  const priceChangeColor = getPriceChangeColor(priceChangeString);

  const handlePress = () => {
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
      asset: token,
      address: token.address,
      chainId: token.chainId,
    });
  };

  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={0.96}>
      <View style={styles.itemContainer}>
        {/* icon */}
        <View style={styles.iconColumn}>
          {iconUrl && (
            <View style={styles.tokenIconContainer}>
              <View style={styles.tokenIconShadow}>
                <RainbowImage source={{ url: iconUrl }} style={styles.tokenIcon} />
                {(ranking === 2 || ranking === 3) && <View style={[styles.rankOverlay, { borderColor: rankingStyle.backgroundColor }]} />}
              </View>
              <View style={styles.chainImageContainer}>
                <ChainImage chainId={token.chainId} size={16} position="absolute" />
              </View>
            </View>
          )}
        </View>

        <View style={styles.contentColumn}>
          {/* Name, Fire icon, Price change */}
          <Inline alignVertical="center">
            <Text color="label" size="15pt" weight="semibold" numberOfLines={1} style={{ marginRight: 6 }}>
              {token.name}
            </Text>
            <Text color={priceChangeColor} size="11pt" weight="bold" style={{ marginRight: 3 }}>
              {priceChangeString[0]}
            </Text>
            <Text color={priceChangeColor} size="15pt" weight="bold">
              {priceChangeString.slice(2)}
            </Text>
          </Inline>

          {/* Rank | VOL | MCAP */}
          <View style={styles.rankInfoRow}>
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

              <View style={styles.statsRow}>
                <SmallLabeledRow label="VOL" value={volume} />

                <View
                  style={[styles.statsSeparator, { backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.08)' : 'rgba(9, 17, 31, 0.08)' }]}
                />

                <SmallLabeledRow label="MCAP" value={marketCap} />
              </View>
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

const SmallLabeledRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.smallLabelRow}>
      <Text color="labelQuaternary" size="11pt" weight="medium">
        {label}
      </Text>

      <Text color="labelTertiary" size="11pt" weight="medium">
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rankingBadge: {
    paddingHorizontal: 3,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  tokenIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  tokenIconShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  chainImageContainer: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    zIndex: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  iconColumn: {
    width: 40,
  },
  contentColumn: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 5,
    marginTop: 1, // visually more centered due to text capsize
  },
  rankOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderWidth: 2,
  },
  rankInfoRow: {
    marginTop: 7,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsSeparator: {
    width: 1,
    height: 12,
  },
  smallLabelRow: {
    flexDirection: 'row',
    gap: 4,
  },
});
