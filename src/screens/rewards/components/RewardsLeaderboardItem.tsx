import React from 'react';
import { Bleed, Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { TOP_RANK_SYMBOLS } from '@/screens/rewards/constants';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import { ContactAvatar } from '@/components/contacts';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { getGradientColorsForRank } from '@/screens/rewards/helpers/getGradientColorsForRank';
import { useTheme } from '@/theme';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ButtonPressAnimation } from '@/components/animations';
import { formatTokenDisplayValue } from '@/screens/rewards/helpers/formatTokenDisplayValue';
import { analyticsV2 } from '@/analytics';

const MaskedGradientText: React.FC<{
  text: string;
  gradientColors: string[];
}> = ({ text, gradientColors }) => {
  return (
    <Box>
      <MaskedView
        maskElement={
          <Box paddingVertical="4px" alignItems="center" justifyContent="center">
            <Text size="13pt" color="label" weight="bold">
              {text}
            </Text>
          </Box>
        }
      >
        <Box paddingVertical="4px" alignItems="center" justifyContent="center" style={{ opacity: 0 }}>
          <Text size="13pt" color="label" weight="bold">
            {text}
          </Text>
        </Box>
        <LinearGradient
          colors={gradientColors}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          start={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </MaskedView>
    </Box>
  );
};

type Props = {
  rank: number;
  avatarUrl?: string;
  address: string;
  ens?: string;
  amountEarnedInToken: number;
  bonusEarnedInToken: number;
  tokenSymbol: string;
};

export const RewardsLeaderboardItem: React.FC<Props> = ({
  address,
  avatarUrl,
  ens,
  amountEarnedInToken,
  bonusEarnedInToken,
  tokenSymbol,
  rank,
}) => {
  const { navigate } = useNavigation();
  const { isDarkMode } = useTheme();
  const formattedAmountEarned = formatTokenDisplayValue(amountEarnedInToken, tokenSymbol);
  const color = !avatarUrl ? addressHashedColorIndex(address) : undefined;
  const emoji = !avatarUrl ? addressHashedEmoji(address) : undefined;

  const formattedBonusEarned = formatTokenDisplayValue(bonusEarnedInToken, tokenSymbol);
  const additionalRewardText = `+${formattedBonusEarned}`;

  const navigateToProfile = () => {
    analyticsV2.track(analyticsV2.event.rewardsPressedLeaderboardItem, {
      ens,
    });
    navigate(Routes.PROFILE_SHEET, {
      address: ens ?? address,
      // TODO: If we want to use it for other rewards we will have to make this analytics configurable
      from: Routes.OP_REWARDS_SHEET,
    });
  };

  return (
    <ButtonPressAnimation onPress={navigateToProfile} scaleTo={0.96} overflowMargin={10}>
      <Stack>
        <Columns space="10px" alignVertical="center">
          <Column width="content">
            <Box>
              {avatarUrl ? <ImageAvatar image={avatarUrl} size="rewards" /> : <ContactAvatar color={color} size="rewards" value={emoji} />}
            </Box>
          </Column>
          <Stack space="8px">
            <Text color="label" ellipsizeMode="middle" numberOfLines={1} size="15pt" weight="semibold" containsEmoji>
              {ens ?? `${address.slice(0, 6)}...${address.slice(-4)}`}
            </Text>
            <Text size="13pt" color="labelTertiary" weight="semibold">
              {formattedAmountEarned}
            </Text>
          </Stack>
          <Column width="content">
            <Inline alignHorizontal="right" alignVertical="center">
              {rank < 4 && <MaskedGradientText text={additionalRewardText} gradientColors={getGradientColorsForRank(rank, isDarkMode)} />}
              {rank >= 4 && (
                <Text size="13pt" color="labelTertiary" weight="bold">
                  {additionalRewardText}
                </Text>
              )}
            </Inline>
          </Column>
          <Column width={{ custom: 42 }}>
            <Inline alignHorizontal="center" alignVertical="center">
              {rank < 4 && rank > 0 ? (
                <Text color="labelTertiary" size="20pt" weight={rank < 4 ? 'heavy' : 'semibold'} containsEmoji={rank < 4}>
                  {TOP_RANK_SYMBOLS[rank.toString()]}
                </Text>
              ) : (
                <Text size={rank >= 100 ? '11pt' : '13pt'} color="labelTertiary" weight="heavy">
                  {`#${rank}`}
                </Text>
              )}
            </Inline>
          </Column>
        </Columns>
      </Stack>
    </ButtonPressAnimation>
  );
};
