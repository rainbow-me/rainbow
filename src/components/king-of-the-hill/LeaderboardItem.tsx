import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
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
import { ChainImage } from '@/components/coin-icon/ChainImage';

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
});

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
        <View style={{ width: 40 }}>
          {iconUrl && (
            <View style={styles.tokenIconContainer}>
              <View style={styles.tokenIconShadow}>
                <RainbowImage source={{ url: iconUrl }} style={styles.tokenIcon} />
                {(ranking === 2 || ranking === 3) && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 22,
                      borderWidth: 2,
                      borderColor: rankingStyle.backgroundColor,
                    }}
                  />
                )}
              </View>
              <View style={styles.chainImageContainer}>
                <ChainImage chainId={token.chainId} size={16} position="absolute" />
              </View>
            </View>
          )}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          {/* Name, Fire icon, Price change */}
          <Inline alignVertical="center" space="6px">
            <Text color="label" size="15pt" weight="semibold" numberOfLines={1}>
              {token.name}
            </Text>
            <FireIcon size={14} />
            <Text color={priceChange.startsWith('+') ? 'green' : 'red'} size="13pt" weight="semibold">
              {priceChange}
            </Text>
          </Inline>

          {/* Rank | VOL | MCAP */}
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

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SmallLabeledRow label="VOL" value={volume} />

                <View
                  style={{
                    width: 1,
                    height: 12,
                    backgroundColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
                  }}
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
    <View style={{ flexDirection: 'row', gap: 4 }}>
      <Text color="labelQuaternary" size="11pt" weight="medium">
        {label}
      </Text>

      <Text color="labelTertiary" size="11pt" weight="medium">
        {value}
      </Text>
    </View>
  );
};
