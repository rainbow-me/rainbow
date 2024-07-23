import { RefreshControl, Share, StyleProp, ViewStyle } from 'react-native';
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useState } from 'react';
import { FloatingEmojis } from '@/components/floating-emojis';
import {
  AccentColorProvider,
  Bleed,
  Border,
  Box,
  Column,
  Columns,
  IconContainer,
  Inline,
  Inset,
  Separator,
  Space,
  Stack,
  Text,
  TextShadow,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { useAccountAccentColor, useAccountProfile, useAccountSettings, useClipboard, useDimensions, useWallets } from '@/hooks';
import { useTheme } from '@/theme';
import { ScrollView } from 'react-native-gesture-handler';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { measureText, safeAreaInsetValues } from '@/utils';
import { ButtonPressAnimation } from '@/components/animations';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { useRecoilState } from 'recoil';
import * as i18n from '@/languages';
import { isNil } from 'lodash';
import { convertAmountAndPriceToNativeDisplay, convertRawAmountToBalance } from '@/helpers/utilities';
import { address as formatAddress } from '@/utils/abbreviations';
import { delay } from '@/utils/delay';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { Page } from '@/components/layout';
import { IS_ANDROID, IS_TEST } from '@/env';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { Skeleton } from '../components/Skeleton';
import { InfoCard } from '../components/InfoCard';
import { analyticsV2 } from '@/analytics';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { RemoteCardCarousel } from '@/components/cards/remote-cards';
import { usePoints } from '@/resources/points';
import { GetPointsDataForWalletQuery } from '@/graphql/__generated__/metadataPOST';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { fonts } from '@/styles';
import { typeHierarchy } from '@/design-system/typography/typeHierarchy';
import { opacity } from '@/__swaps__/utils/swaps';
import { LIGHT_SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import FastImage, { Source } from 'react-native-fast-image';
import EthIcon from '@/assets/eth-icon.png';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import Animated, { runOnUI, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { Network } from '@/helpers';
import { format, intervalToDuration, isToday } from 'date-fns';
import { useRemoteConfig } from '@/model/remoteConfig';
import { ETH_REWARDS, useExperimentalFlag } from '@/config';
import { RewardsActionButton } from '../components/RewardsActionButton';

const InfoCards = ({ points }: { points: GetPointsDataForWalletQuery | undefined }) => {
  const labelSecondary = useForegroundColor('labelSecondary');
  const green = useForegroundColor('green');
  const yellow = useForegroundColor('yellow');
  const red = useForegroundColor('red');

  //
  // RECENT EARNINGS CARD
  //
  const lastPeriodLoading = points === undefined;
  const lastPeriod = points?.points?.user?.stats?.last_period;
  const lastPeriodEarnings = lastPeriod?.earnings?.total;
  const lastPeriodRank = lastPeriod?.position?.current;
  const lastPeriodUnranked = lastPeriod?.position?.unranked;

  //
  // REFERRALS CARD
  //
  const referralsEarnings = points?.points?.user?.earnings_by_type?.find(earningsGroup => earningsGroup?.type === 'referral')?.earnings
    ?.total;
  const qualifiedReferees = points?.points?.user?.stats?.referral?.qualified_referees;
  const isLoadingReferralsCard = qualifiedReferees === undefined || referralsEarnings == undefined;

  //
  // RANK CARD
  //
  const rank = points?.points?.user.stats.position.current;
  const isUnranked = points?.points?.user?.stats?.position?.unranked;
  const lastWeekRank = points?.points?.user.stats.last_airdrop?.position.current;
  const rankChange = rank && lastWeekRank ? rank - lastWeekRank : undefined;
  const isLoadingRankCard = (!rank || rankChange === undefined) && isUnranked === undefined;

  const getRankChangeIcon = () => {
    if (rankChange === undefined || isUnranked) return undefined;

    if (rankChange === 0) return '􁘶';

    if (rankChange < 0) return '􀑁';

    return '􁘳';
  };

  const getRankCardAccentColor = () => {
    if (isUnranked) return green;

    if (rankChange === undefined || rankChange > 0) return red;

    if (rankChange === 0) return yellow;

    return green;
  };

  const getRankCardSubtitle = () => {
    if (isUnranked) return i18n.t(i18n.l.points.points.points_to_rank);

    if (rankChange === undefined) return '';
    if (rankChange === 0) return i18n.t(i18n.l.points.points.no_change);

    return Math.abs(rankChange).toLocaleString('en-US');
  };

  const getRankCardMainText = () => {
    if (!rank) return '';
    return isUnranked ? i18n.t(i18n.l.points.points.unranked) : `#${rank.toLocaleString('en-US')}`;
  };

  const getEarnedLastWeekSubtitle = () => {
    if (lastPeriodUnranked || !lastPeriodRank) return i18n.t(i18n.l.points.points.no_weekly_rank);
    if (lastPeriodRank <= 10) return i18n.t(i18n.l.points.points.top_10_earner);
    return i18n.t(i18n.l.points.points.ranking, {
      rank: lastPeriodRank.toLocaleString('en-US'),
    });
  };

  return (
    <Bleed space="20px">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Inset space="20px">
          <Inline separator={<Box width={{ custom: 12 }} />} wrap={false}>
            <InfoCard
              loading={lastPeriodLoading}
              title={i18n.t(i18n.l.points.points.earned_last_week)}
              mainText={
                lastPeriodEarnings
                  ? `${lastPeriodEarnings.toLocaleString('en-US')} ${i18n.t(i18n.l.points.points.points_capitalized)}`
                  : undefined
              }
              placeholderMainText={i18n.t(i18n.l.points.points.zero_points)}
              icon="􀠐"
              subtitle={getEarnedLastWeekSubtitle()}
              accentColor={labelSecondary}
            />
            <InfoCard
              loading={isLoadingReferralsCard}
              title={i18n.t(i18n.l.points.points.referrals)}
              mainText={qualifiedReferees ? qualifiedReferees.toLocaleString('en-US') : undefined}
              placeholderMainText={i18n.t(i18n.l.points.points.none)}
              icon="􀇯"
              subtitle={`${referralsEarnings?.toLocaleString('en-US') ?? '0'} ${i18n.t(i18n.l.points.points.points_capitalized)}`}
              accentColor={yellow}
            />
            <InfoCard
              loading={isLoadingRankCard}
              title={i18n.t(i18n.l.points.points.your_rank)}
              mainText={getRankCardMainText()}
              icon={getRankChangeIcon()}
              subtitle={getRankCardSubtitle()}
              mainTextColor={isUnranked ? 'secondary' : 'primary'}
              accentColor={getRankCardAccentColor()}
            />
          </Inline>
        </Inset>
      </ScrollView>
    </Bleed>
  );
};

const Card = ({ borderRadius = 32, children, padding = '12px' }: { borderRadius?: number; children: React.ReactNode; padding?: Space }) => {
  const { isDarkMode } = useColorMode();

  return (
    <Box
      background="surfacePrimary"
      borderRadius={borderRadius}
      shadow={isDarkMode ? undefined : '12px'}
      style={{ backgroundColor: isDarkMode ? '#191A1C' : globalColors.white100 }}
      width="full"
    >
      <Inset space={padding}>{children}</Inset>
      <Border borderRadius={borderRadius} borderWidth={THICK_BORDER_WIDTH} />
    </Box>
  );
};

const ClaimCard = memo(function ClaimCard({ claim, value }: { claim?: string; value?: string }) {
  const { isDarkMode } = useColorMode();
  const { navigate } = useNavigation();

  return (
    <Card>
      <Box alignItems="center" gap={20} paddingBottom="28px" paddingTop="16px">
        <TextShadow shadowOpacity={0.3}>
          <Text align="center" color="label" size="20pt" weight="heavy">
            {i18n.t(i18n.l.points.points.available_to_claim)}
          </Text>
        </TextShadow>
        <Box alignItems="center" flexDirection="row" gap={8}>
          <Bleed vertical="8px">
            <EthRewardsCoinIcon animatedBorder />
          </Bleed>
          <TextShadow blur={28} shadowOpacity={0.2}>
            <Text align="center" color="label" size="44pt" weight="black">
              {value}
            </Text>
          </TextShadow>
        </Box>
      </Box>
      <ButtonPressAnimation
        onPress={() => navigate(Routes.CLAIM_REWARDS_PANEL)}
        scaleTo={0.925}
        style={{
          alignItems: 'center',
          alignSelf: 'center',
          height: 80,
          justifyContent: 'center',
          marginVertical: -12,
          paddingVertical: 12,
          pointerEvents: 'box-only',
          width: DEVICE_WIDTH - 40,
        }}
      >
        <MaskedView
          maskElement={
            <RewardsActionButton
              label={i18n.t(i18n.l.points.points.claim, {
                value: claim || '',
              })}
            />
          }
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            width: DEVICE_WIDTH,
          }}
        >
          <Bleed vertical={{ custom: 116 }}>
            <LinearGradient
              colors={[
                '#B2348C',
                '#B2348C',
                '#FF6040',
                isDarkMode ? '#FFFF00' : '#FFBB00',
                isDarkMode ? '#34FF3B' : '#A6E000',
                '#24D2FB',
                '#24D2FB',
              ]}
              end={{ x: 1, y: 0.5 }}
              locations={[0, 0.08, 0.29, 0.5, 0.71, 0.92, 1]}
              start={{ x: 0, y: 0.5 }}
              style={{ height: 116 + 56 + 116, width: DEVICE_WIDTH }}
            />
          </Bleed>
        </MaskedView>
      </ButtonPressAnimation>
    </Card>
  );
});

const EarnRewardsCard = memo(function EarnRewardsCard() {
  return (
    <Card padding="20px">
      <Box paddingVertical="8px">
        <Stack space="20px">
          <Inline alignHorizontal="center" alignVertical="center" space="10px">
            <IconContainer height={12} width={24}>
              <TextShadow>
                <Text align="center" color="accent" size="icon 17px" weight="heavy">
                  􀐾
                </Text>
              </TextShadow>
            </IconContainer>
            <TextShadow shadowOpacity={0.2}>
              <Text align="center" color="label" size="20pt" weight="heavy">
                {i18n.t(i18n.l.points.points.earn_eth_rewards)}
              </Text>
            </TextShadow>
          </Inline>
          <Text align="center" color="labelQuaternary" size="13pt / 135%" weight="semibold">
            {i18n.t(i18n.l.points.points.rewards_explainer)}
          </Text>
        </Stack>
      </Box>
    </Card>
  );
});

const EarningsCard = memo(function EarningsCard({ claimed, value }: { claimed?: string; value?: string }) {
  return (
    <Card padding="20px">
      <Box gap={24} paddingVertical="4px" width="full">
        <Inline alignHorizontal="justify" alignVertical="center">
          <Inline alignVertical="center" space="10px">
            <IconContainer height={12} width={24}>
              <TextShadow>
                <Text align="center" color="accent" size="icon 15px" weight="heavy">
                  􀐾
                </Text>
              </TextShadow>
            </IconContainer>
            <TextShadow shadowOpacity={0.2}>
              <Text align="center" color="label" size="17pt" weight="heavy">
                {i18n.t(i18n.l.points.points.my_earnings)}
              </Text>
            </TextShadow>
          </Inline>
          {/* ⚠️ TODO: Re-enable once we add an explain sheet

           <ButtonPressAnimation>
            <IconContainer height={12} width={24}>
              <Text align="center" color={{ custom: opacity(labelQuaternary, 0.24) }} size="icon 15px" weight="heavy">
                􀁝
              </Text>
            </IconContainer>
          </ButtonPressAnimation> */}
        </Inline>
        <Columns alignHorizontal="justify" alignVertical="center">
          <Box alignItems="center" flexDirection="row" gap={10}>
            <Bleed vertical="8px">
              <EthRewardsCoinIcon size={32} />
            </Bleed>
            <Stack space="10px">
              <Text color="labelTertiary" size="13pt" weight="bold">
                {i18n.t(i18n.l.points.points.claimed_earnings)}
              </Text>
              <TextShadow shadowOpacity={0.2}>
                <Text color="label" size="17pt" weight="heavy">
                  {claimed}
                </Text>
              </TextShadow>
            </Stack>
          </Box>
          <Stack alignHorizontal="right" space="10px">
            <Text align="right" color="labelTertiary" size="13pt" weight="bold">
              {i18n.t(i18n.l.points.points.current_value)}
            </Text>
            <TextShadow shadowOpacity={0.2}>
              <Text align="right" color="label" size="17pt" weight="heavy">
                {value}
              </Text>
            </TextShadow>
          </Stack>
        </Columns>
      </Box>
    </Card>
  );
});

const TotalEarnedByRainbowUsers = memo(function TotalEarnedByRainbowUsers({ earned }: { earned?: string }) {
  if (!earned) return null;
  return (
    <Box alignItems="center" justifyContent="center" width="full">
      <Columns alignHorizontal="center" alignVertical="center" space="6px">
        <Column width="content">
          <Text align="center" color="labelTertiary" size="13pt" weight="bold">
            {i18n.t(i18n.l.points.points.rainbow_users_have_earned)}
          </Text>
        </Column>
        <Column width="content">
          <Box alignItems="center" flexDirection="row">
            <Bleed vertical="4px">
              <EthRewardsCoinIcon borderWidth={1} size={14} style={{ marginRight: 4 }} />
            </Bleed>
            <TextShadow blur={12} shadowOpacity={0.3}>
              <Text align="center" color="labelSecondary" size="13pt" weight="heavy">
                {earned}
              </Text>
            </TextShadow>
          </Box>
        </Column>
      </Columns>
    </Box>
  );
});

export const EthRewardsCoinIcon = memo(function EthRewardsCoinIcon({
  animatedBorder,
  borderWidth = THICK_BORDER_WIDTH,
  showBorder = true,
  size = 44,
  style,
}: {
  animatedBorder?: boolean;
  borderWidth?: number;
  showBorder?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDarkMode } = useColorMode();

  const rotation = useSharedValue(0);

  const rotatingBorder = useAnimatedStyle(() => {
    return {
      transform: animatedBorder ? [{ rotate: `${rotation.value}deg` }] : undefined,
    };
  });

  useEffect(() => {
    if (animatedBorder && !IS_TEST) {
      runOnUI(() => {
        const currentRotation = rotation.value;
        rotation.value = currentRotation;
        rotation.value = withRepeat(withTiming(180, { duration: 6000 }), -1, true);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box style={[{ height: size, overflow: 'hidden', width: size }, style]}>
      <FastImage source={EthIcon as Source} style={{ height: size, width: size }} />
      {showBorder && isDarkMode && (
        <Animated.View style={[animatedBorder ? rotatingBorder : {}, { height: size, position: 'absolute', width: size }]}>
          <MaskedView
            maskElement={<Border borderColor="label" borderRadius={size / 2} borderWidth={borderWidth} />}
            style={{ height: size, position: 'absolute', width: size }}
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.12)',
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0)',
              ]}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.09, 0.41, 0.78, 1]}
              start={{ x: 0, y: 0.5 }}
              style={{ height: size, position: 'absolute', width: size }}
            />
          </MaskedView>
        </Animated.View>
      )}
    </Box>
  );
});

const NextDistributionCountdown = ({ nextDistribution }: { nextDistribution: Date }) => {
  const [nextDistributionIn, recalcNextDistributionDistance] = useReducer(
    () =>
      intervalToDuration({
        start: Date.now(),
        end: nextDistribution,
      }),
    intervalToDuration({
      start: Date.now(),
      end: nextDistribution,
    })
  );

  useEffect(() => {
    const interval = setInterval(recalcNextDistributionDistance, 1000);
    return () => clearInterval(interval);
  }, [nextDistribution]);

  const { days, hours, minutes } = nextDistributionIn;
  const dayStr = days ? `${days}d` : '';
  const hourStr = hours ? `${hours}h` : '';
  const minuteStr = minutes ? `${minutes}m` : '';

  return (
    <Text align="center" color="labelSecondary" size="17pt" weight="heavy">
      {`${dayStr} ${hourStr} ${minuteStr}`.trim()}
    </Text>
  );
};

const NextDropCard = memo(function NextDropCard({ nextDistribution }: { nextDistribution: Date }) {
  const { isDarkMode } = useColorMode();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const nextDistributionWithDay = isToday(nextDistribution)
    ? `${i18n.t(i18n.l.points.points.today)} ${format(nextDistribution, 'p')}`
    : format(nextDistribution, 'cccc p');

  return (
    <Card>
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingLeft="8px" width="full">
        <Box alignItems="center" flexDirection="row">
          <IconContainer size={24}>
            <TextShadow>
              <Text color="accent" size="icon 17px" weight="heavy">
                􀐫
              </Text>
            </TextShadow>
          </IconContainer>
          <Box gap={10} paddingLeft="10px">
            <Stack space="10px">
              <TextShadow shadowOpacity={0.2}>
                <Text color="label" size="17pt" weight="heavy">
                  {i18n.t(i18n.l.points.points.next_drop)}
                </Text>
              </TextShadow>
              <Text color="labelTertiary" size="13pt" weight="bold">
                {nextDistributionWithDay}
              </Text>
            </Stack>
          </Box>
        </Box>
        <Box
          alignItems="center"
          background="fillQuaternary"
          borderRadius={18}
          height={{ custom: 36 }}
          justifyContent="center"
          margin={{ custom: 2 }}
          paddingHorizontal="12px"
          style={{
            backgroundColor: isDarkMode ? opacity(LIGHT_SEPARATOR_COLOR, 0.05) : globalColors.white100,
            borderColor: separatorSecondary,
            borderCurve: 'continuous',
            borderWidth: THICK_BORDER_WIDTH,
            overflow: 'hidden',
          }}
        >
          <TextShadow shadowOpacity={0.24}>
            <NextDistributionCountdown nextDistribution={nextDistribution} />
          </TextShadow>
        </Box>
      </Box>
    </Card>
  );
});

const getTextWidth = async (text: string | undefined) => {
  const { width } = await measureText(text, {
    fontSize: 44,
    fontWeight: fonts.weight.black,
    letterSpacing: typeHierarchy.text['44pt'].letterSpacing,
  });
  return width;
};

const RainbowText = memo(function RainbowText({ totalPointsString }: { totalPointsString: string | undefined }) {
  const { isDarkMode } = useColorMode();
  const [textWidth, setTextWidth] = useState<number | undefined>((totalPointsString?.length ?? 0) * 32);

  const totalPointsMaskSize = Math.min((textWidth ?? 32 * (totalPointsString?.length ?? 0)) + 20 * 2, DEVICE_WIDTH);

  useLayoutEffect(() => {
    if (totalPointsString && totalPointsString.length > 0) {
      getTextWidth(totalPointsString).then(setTextWidth);
    }
  }, [totalPointsString]);

  return (
    <Bleed vertical="10px">
      <MaskedView
        style={{
          alignItems: 'center',
          height: 51,
          pointerEvents: 'none',
        }}
        androidRenderingMode="software"
        maskElement={
          <Box height="full" justifyContent="center" width="full">
            <TextShadow blur={20} enableOnAndroid shadowOpacity={0.4}>
              <Text color="label" size="44pt" weight="black">
                {totalPointsString}
              </Text>
            </TextShadow>
          </Box>
        }
      >
        <LinearGradient
          colors={[
            '#B2348C',
            '#B2348C',
            '#FF6040',
            isDarkMode ? '#FFFF00' : '#FFBB00',
            isDarkMode ? '#34FF3B' : '#A6E000',
            '#24D2FB',
            '#24D2FB',
            '#24D2FB',
          ]}
          end={{ x: 0, y: 0.5 }}
          locations={[0, 0.08, 0.248, 0.416, 0.584, 0.752, 0.92, 1]}
          start={{ x: 1, y: 0.5 }}
          style={{
            height: 71,
            left: -24,
            top: -10,
            width: totalPointsMaskSize,
          }}
        />
      </MaskedView>
    </Bleed>
  );
});

export function PointsContent() {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();
  const { name } = useRoute();
  const { width: deviceWidth } = useDimensions();
  const getCardIdsForScreen = remoteCardsStore(state => state.getCardIdsForScreen);
  const { accountAddress, accountENS } = useAccountProfile();
  const { setClipboard } = useClipboard();
  const { isReadOnlyWallet } = useWallets();
  const { highContrastAccentColor: accountColor } = useAccountAccentColor();
  const { nativeCurrency: currency } = useAccountSettings();
  const { rewards_enabled } = useRemoteConfig();

  const rewardsEnabled = useExperimentalFlag(ETH_REWARDS) || rewards_enabled;

  const {
    data: points,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = usePoints({
    walletAddress: accountAddress,
  });

  const cardIds = useMemo(() => getCardIdsForScreen(name as keyof typeof Routes), [getCardIdsForScreen, name]);

  useFocusEffect(
    useCallback(() => {
      analyticsV2.track(analyticsV2.event.pointsViewedPointsScreen);
    }, [])
  );

  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);

  const referralCode = points?.points?.user?.referralCode
    ? points.points.user.referralCode.slice(0, 3) + '-' + points.points.user.referralCode.slice(3, 7)
    : undefined;

  const onPressCopy = React.useCallback(
    (onNewEmoji: () => void) => {
      if (!isToastActive) {
        setToastActive(true);
        setTimeout(() => {
          setToastActive(false);
        }, 2000);
      }
      onNewEmoji();
      referralCode && setClipboard(referralCode);
      analyticsV2.track(analyticsV2.event.pointsPointsScreenPressedCopyReferralCodeButton);
    },
    [isToastActive, referralCode, setClipboard, setToastActive]
  );

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    if (!dataUpdatedAt || Date.now() - dataUpdatedAt > 30_000) {
      refetch();
    }
    await delay(2000);
    setIsRefreshing(false);
  }, [dataUpdatedAt, refetch]);

  const totalPointsString = points?.points?.user?.earnings?.total.toLocaleString('en-US');

  const rank = points?.points?.user.stats.position.current;
  const isUnranked = !!points?.points?.user?.stats?.position?.unranked;

  const eth = useNativeAssetForNetwork(Network.mainnet);
  const rewards = points?.points?.user?.rewards;
  const { claimed, claimable } = rewards || {};
  const showClaimYourPoints = claimable && claimable !== '0';
  const showMyEarnings = claimed && claimed !== '0';
  const showNoHistoricalRewards = !showMyEarnings;

  const claimedBalance = convertRawAmountToBalance(claimed || '0', {
    decimals: 18,
    symbol: 'ETH',
  });
  const claimableBalance = convertRawAmountToBalance(claimable || '0', {
    decimals: 18,
    symbol: 'ETH',
  });
  const claimedPrice = convertAmountAndPriceToNativeDisplay(claimedBalance.amount, eth?.price?.value || 0, currency)?.display;
  const claimablePrice = convertAmountAndPriceToNativeDisplay(claimableBalance.amount, eth?.price?.value || 0, currency)?.display;

  const totalRewards = points?.points?.meta?.rewards?.total;
  const totalRewardsDisplay = convertRawAmountToBalance(
    totalRewards || '0',
    {
      decimals: 18,
      symbol: 'ETH',
    },
    undefined,
    true
  )?.display;

  const nextDistribution = points?.points?.meta?.distribution?.next;
  const nextDistributionDate = nextDistribution ? new Date(nextDistribution * 1000) : null;

  const canDisplayTotalPoints = !isNil(points?.points?.user.earnings.total);
  const canDisplayCurrentRank = !!rank;

  const canDisplayLeaderboard = !!points?.points?.leaderboard.accounts;

  const shouldDisplayError = !isFetching && !points?.points;

  const referralUrl = points?.points?.user?.referralCode
    ? `https://www.rainbow.me/points?ref=${points.points.user.referralCode}`
    : undefined;

  return (
    <Box height="full" as={Page} flex={1} style={{ backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }}>
      <ScrollView
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor={colors.alpha(colors.blueGreyDark, 0.4)} />}
        scrollIndicatorInsets={{
          bottom: TAB_BAR_HEIGHT - safeAreaInsetValues.bottom,
          top: 12,
        }}
        contentContainerStyle={{
          height: !shouldDisplayError ? undefined : '100%',
          paddingBottom: TAB_BAR_HEIGHT + 32,
        }}
        showsVerticalScrollIndicator={!shouldDisplayError}
      >
        <AccentColorProvider color={accountColor}>
          <Inset horizontal="20px" top="12px">
            <Box gap={24}>
              {rewardsEnabled && (showClaimYourPoints || showMyEarnings) && (
                <Box gap={20}>
                  {showClaimYourPoints && !isReadOnlyWallet && <ClaimCard claim={claimableBalance.display} value={claimablePrice} />}
                  {showMyEarnings && <EarningsCard claimed={claimedBalance.display} value={claimedPrice} />}
                </Box>
              )}
              {rewardsEnabled && showNoHistoricalRewards && <EarnRewardsCard />}
              {rewardsEnabled && <TotalEarnedByRainbowUsers earned={totalRewardsDisplay} />}
              {nextDistributionDate && <NextDropCard nextDistribution={nextDistributionDate} />}
              <Separator color={isDarkMode ? 'separatorSecondary' : 'separatorTertiary'} thickness={1} />
            </Box>
          </Inset>
          {!shouldDisplayError ? (
            <Inset horizontal="20px" top="24px">
              <Stack space="28px">
                <Stack space="20px">
                  <Text color="label" size="20pt" style={{ marginLeft: 4 }} weight="heavy">
                    {i18n.t(i18n.l.points.points.my_points)}
                  </Text>
                  <Box flexDirection="row" alignItems="center" paddingLeft="4px">
                    {canDisplayTotalPoints ? <RainbowText totalPointsString={totalPointsString} /> : <Skeleton height={31} width={200} />}
                  </Box>
                </Stack>
                <Box gap={24}>
                  {!!cardIds.length && !isReadOnlyWallet && <RemoteCardCarousel key="remote-cards" />}
                  <InfoCards points={points} />
                </Box>
                <Separator color={isDarkMode ? 'separatorSecondary' : 'separatorTertiary'} thickness={1} />
                {!isReadOnlyWallet && (
                  <>
                    <Stack space="20px">
                      <Text color="label" size="20pt" style={{ marginLeft: 4 }} weight="heavy">
                        {i18n.t(i18n.l.points.points.refer_friends)}
                      </Text>
                      {referralCode ? (
                        <Columns space="12px">
                          <Column width="1/2">
                            {/* @ts-expect-error FloatingEmojis is an old JS component */}
                            <FloatingEmojis distance={250} duration={500} fadeOut={false} scaleTo={0} size={50} wiggleFactor={0}>
                              {({ onNewEmoji }: { onNewEmoji: () => void }) => (
                                <ButtonPressAnimation onPress={() => onPressCopy(onNewEmoji)} overflowMargin={50}>
                                  <Box
                                    background="surfaceSecondaryElevated"
                                    shadow="12px"
                                    borderRadius={18}
                                    height={{ custom: 48 }}
                                    width="full"
                                    justifyContent="center"
                                    alignItems="center"
                                    style={{ backgroundColor: isDarkMode ? '#191A1C' : globalColors.white100 }}
                                  >
                                    <Text size="20pt" align="center" color="label" weight="heavy">
                                      {referralCode}
                                    </Text>
                                    <Border borderRadius={18} />
                                  </Box>
                                </ButtonPressAnimation>
                              )}
                            </FloatingEmojis>
                          </Column>
                          <Column width="1/2">
                            <ButtonPressAnimation
                              onPress={() => {
                                if (referralUrl) {
                                  analyticsV2.track(analyticsV2.event.pointsPointsScreenPressedShareReferralLinkButton);
                                  Share.share(
                                    IS_ANDROID
                                      ? {
                                          message: referralUrl,
                                        }
                                      : {
                                          url: referralUrl,
                                        }
                                  );
                                }
                              }}
                              overflowMargin={50}
                            >
                              <Box
                                background="surfaceSecondaryElevated"
                                shadow="12px"
                                borderRadius={18}
                                height={{ custom: 48 }}
                                width="full"
                                justifyContent="center"
                                alignItems="center"
                                style={{ backgroundColor: isDarkMode ? '#191A1C' : globalColors.white100 }}
                              >
                                <MaskedView
                                  style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: 48,
                                    width: '100%',
                                  }}
                                  maskElement={
                                    <Box alignItems="center" flexDirection="row" height="full" style={{ gap: 4 }} justifyContent="center">
                                      <TextShadow blur={12}>
                                        <Text align="center" weight="heavy" color="label" size="15pt">
                                          􀈂
                                        </Text>
                                      </TextShadow>
                                      <TextShadow blur={12}>
                                        <Text align="center" weight="heavy" color="label" size="16px / 22px (Deprecated)">
                                          {i18n.t(i18n.l.points.points.share_link)}
                                        </Text>
                                      </TextShadow>
                                    </Box>
                                  }
                                >
                                  <LinearGradient
                                    style={{
                                      width: 131,
                                      height: 48,
                                    }}
                                    colors={['#00E7F3', '#57EA5F']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                  />
                                </MaskedView>
                                <Border borderRadius={18} />
                              </Box>
                            </ButtonPressAnimation>
                          </Column>
                        </Columns>
                      ) : (
                        <Columns space="12px">
                          <Column width="1/2">
                            <Skeleton width={(deviceWidth - 40 - 12) / 2} height={48} />
                          </Column>
                          <Column width="1/2">
                            <Skeleton width={(deviceWidth - 40 - 12) / 2} height={48} />
                          </Column>
                        </Columns>
                      )}
                      <Inset horizontal="4px">
                        <Text color="labelQuaternary" size="13pt" weight="semibold" align="left">
                          {i18n.t(i18n.l.points.points.earn_points_for_referring)}
                        </Text>
                      </Inset>
                    </Stack>
                    <Separator color={isDarkMode ? 'separatorSecondary' : 'separatorTertiary'} thickness={1} />
                  </>
                )}
                <Stack space="20px">
                  <Inset left="4px">
                    <Text color="label" size="20pt" weight="heavy">
                      {i18n.t(i18n.l.points.points.leaderboard)}
                    </Text>
                  </Inset>
                  {canDisplayCurrentRank ? (
                    <Box
                      background="surfaceSecondaryElevated"
                      shadow="12px"
                      as={LinearGradient}
                      style={{ padding: 5 / 3, borderRadius: 18 + 5 / 3 }}
                      colors={['#31BCC4', '#57EA5F', '#F0D83F', '#DF5337', '#B756A7']}
                      useAngle={true}
                      angle={-15}
                      angleCenter={{ x: 0.5, y: 0.5 }}
                    >
                      <Box
                        background="surfaceSecondaryElevated"
                        width="full"
                        height={{ custom: 48 }}
                        borderRadius={18}
                        flexDirection="row"
                        paddingHorizontal="20px"
                        justifyContent="space-between"
                        alignItems="center"
                        style={{ backgroundColor: isDarkMode ? '#191A1C' : globalColors.white100 }}
                      >
                        <Box style={{ maxWidth: 220 }}>
                          <Text color="label" size="17pt" weight="heavy" numberOfLines={1} ellipsizeMode="middle">
                            {accountENS ? accountENS : formatAddress(accountAddress, 4, 5)}
                          </Text>
                        </Box>
                        <Text color={isUnranked ? 'labelQuaternary' : 'label'} size="17pt" weight="heavy">
                          {isUnranked ? i18n.t(i18n.l.points.points.unranked) : `#${rank.toLocaleString('en-US')}`}
                        </Text>
                      </Box>
                    </Box>
                  ) : (
                    <Skeleton width={deviceWidth - 40} height={51} />
                  )}
                  {canDisplayLeaderboard ? (
                    <Box
                      background="surfaceSecondaryElevated"
                      borderRadius={20}
                      shadow="12px"
                      style={{ backgroundColor: isDarkMode ? '#191A1C' : globalColors.white100 }}
                    >
                      <Stack separator={<Separator color="separatorTertiary" thickness={1} />}>
                        {points?.points?.leaderboard?.accounts
                          ?.slice(0, 100)
                          ?.map((account, index) => (
                            <LeaderboardRow
                              address={account.address}
                              ens={account.ens}
                              avatarURL={account.avatarURL}
                              points={account.earnings.total}
                              rank={index + 1}
                              key={account.address}
                            />
                          ))}
                      </Stack>
                      <Border borderRadius={20} />
                    </Box>
                  ) : (
                    <Skeleton height={400} width={deviceWidth - 40} />
                  )}
                </Stack>
              </Stack>
            </Inset>
          ) : (
            <Box alignItems="center" justifyContent="center" height="full" width="full">
              <Text size="17pt" weight="bold" align="center" color="labelTertiary">
                {i18n.t(i18n.l.points.points.error)}
              </Text>
            </Box>
          )}
        </AccentColorProvider>
      </ScrollView>
      <ToastPositionContainer>
        <Toast isVisible={isToastActive} text={`􀁣 ${i18n.t(i18n.l.points.points.referral_code_copied)}`} />
      </ToastPositionContainer>
    </Box>
  );
}
