import React, { useCallback, useMemo } from 'react';
import { RefreshControl, Share } from 'react-native';
import { FloatingEmojis } from '@/components/floating-emojis';
import { Bleed, Box, Column, Columns, Cover, Inline, Inset, Separator, Stack, Text, useForegroundColor } from '@/design-system';
import { useAccountProfile, useClipboard, useDimensions, useWallets } from '@/hooks';
import { useTheme } from '@/theme';
import { ScrollView } from 'react-native-gesture-handler';
import MaskedView from '@react-native-masked-view/masked-view';
import BlurredRainbow from '@/assets/blurredRainbow.png';
import Planet from '@/assets/planet.png';
import LinearGradient from 'react-native-linear-gradient';
import { safeAreaInsetValues } from '@/utils';
import { ButtonPressAnimation } from '@/components/animations';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { useRecoilState } from 'recoil';
import * as i18n from '@/languages';
import { isNil } from 'lodash';
import { getFormattedTimeQuantity } from '@/helpers/utilities';
import { address as formatAddress } from '@/utils/abbreviations';
import { delay } from '@/utils/delay';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { Page } from '@/components/layout';
import { IS_ANDROID } from '@/env';
import { ImgixImage } from '@/components/images';
import { Source } from 'react-native-fast-image';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { Skeleton } from '../components/Skeleton';
import { InfoCard } from '../components/InfoCard';
import { displayNextDistribution } from '../constants';
import { analyticsV2 } from '@/analytics';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { RemoteCardCarousel, useRemoteCardContext } from '@/components/cards/remote-cards';
import { usePoints } from '@/resources/points';
import { GetPointsDataForWalletQuery } from '@/graphql/__generated__/metadataPOST';

const InfoCards = ({ points }: { points: GetPointsDataForWalletQuery | undefined }) => {
  const labelSecondary = useForegroundColor('labelSecondary');
  const green = useForegroundColor('green');
  const yellow = useForegroundColor('yellow');
  const red = useForegroundColor('red');

  //
  // NEXT REWARD CARD
  //
  const nextDistributionSeconds = points?.points?.meta?.distribution?.next;
  const isLoadingNextRewardCard = nextDistributionSeconds === undefined;

  const getNextRewardCardMainText = () => {
    if (nextDistributionSeconds === undefined) return '';

    // if next drop has not happened, show time remaining
    return Date.now() >= nextDistributionSeconds * 1000
      ? i18n.t(i18n.l.points.points.now)
      : getFormattedTimeQuantity(nextDistributionSeconds * 1000 - Date.now(), 2);
  };

  const getNextRewardCardSubtitle = () => {
    if (nextDistributionSeconds === undefined) return '';

    // date and time of next drop
    return displayNextDistribution(nextDistributionSeconds);
  };

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

    return Math.abs(rankChange).toLocaleString('en-US');
  };

  const getRankCardMainText = () => {
    if (!rank) return '';
    return isUnranked ? i18n.t(i18n.l.points.points.unranked) : `#${rank.toLocaleString('en-US')}`;
  };

  return (
    <Bleed space="20px">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Inset space="20px">
          <Inline separator={<Box width={{ custom: 12 }} />} wrap={false}>
            <InfoCard
              loading={isLoadingNextRewardCard}
              title={i18n.t(i18n.l.points.points.next_drop)}
              mainText={getNextRewardCardMainText()}
              icon="􀉉"
              subtitle={getNextRewardCardSubtitle()}
              accentColor={labelSecondary}
            />
            <InfoCard
              loading={isLoadingReferralsCard}
              title={i18n.t(i18n.l.points.points.referrals)}
              mainText={qualifiedReferees?.toLocaleString('en-US') ?? '0'}
              icon="􀇯"
              subtitle={`${referralsEarnings?.toLocaleString('en-US') ?? '0'} ${i18n.t(i18n.l.points.points.points)}`}
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

export default function PointsContent() {
  const { colors } = useTheme();
  const { name } = useRoute();
  const { width: deviceWidth } = useDimensions();
  const { getCardsForPlacement } = useRemoteCardContext();
  const { accountAddress, accountENS } = useAccountProfile();
  const { setClipboard } = useClipboard();
  const { isReadOnlyWallet } = useWallets();

  const {
    data: points,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = usePoints({
    walletAddress: accountAddress,
  });

  const cards = useMemo(() => getCardsForPlacement(name as string), [getCardsForPlacement, name]);

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
  const totalPointsMaskSize = 60 * Math.max(totalPointsString?.length ?? 0, 4);

  const rank = points?.points?.user.stats.position.current;
  const isUnranked = !!points?.points?.user?.stats?.position?.unranked;

  const canDisplayTotalPoints = !isNil(points?.points?.user.earnings.total);
  const canDisplayCurrentRank = !!rank;

  const canDisplayLeaderboard = !!points?.points?.leaderboard.accounts;

  const shouldDisplayError = !isFetching && !points?.points;

  const referralUrl = points?.points?.user?.referralCode
    ? `https://www.rainbow.me/points?ref=${points.points.user.referralCode}`
    : undefined;

  return (
    <Box height="full" background="surfacePrimary" as={Page} flex={1}>
      <ScrollView
        scrollIndicatorInsets={{
          bottom: TAB_BAR_HEIGHT - safeAreaInsetValues.bottom,
        }}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + 32,
          height: !shouldDisplayError ? undefined : '100%',
        }}
        showsVerticalScrollIndicator={!shouldDisplayError}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor={colors.alpha(colors.blueGreyDark, 0.4)} />}
      >
        {!shouldDisplayError ? (
          <Inset horizontal="20px" top="10px">
            <Stack space="32px">
              <Bleed bottom={{ custom: 14 }}>
                <Box flexDirection="row" alignItems="center" height={{ custom: 51 }} paddingLeft="4px">
                  {canDisplayTotalPoints ? (
                    <MaskedView
                      style={{
                        alignItems: 'center',
                        height: 51,
                        maxWidth: deviceWidth - 60 - 20 - 20,
                      }}
                      androidRenderingMode="software"
                      maskElement={
                        <Box paddingVertical="10px">
                          <Text color="label" size="44pt" weight="black">
                            {totalPointsString}
                          </Text>
                        </Box>
                      }
                    >
                      <ImgixImage
                        source={BlurredRainbow as Source}
                        size={totalPointsMaskSize}
                        style={{
                          width: totalPointsMaskSize,
                          height: totalPointsMaskSize,
                          left: ios ? -100 : -144,
                          top: -totalPointsMaskSize + (totalPointsString?.length ?? 0) * 5 + 80,
                        }}
                      />
                    </MaskedView>
                  ) : (
                    <Skeleton height={31} width={200} />
                  )}
                  <Cover>
                    <Box alignItems="flex-end" width="full" justifyContent="center" height="full" paddingRight="4px">
                      <ImgixImage
                        source={Planet as Source}
                        size={60.19}
                        style={{
                          width: 60.19,
                          height: 36,
                        }}
                      />
                    </Box>
                  </Cover>
                </Box>
              </Bleed>
              {!!cards.length && !isReadOnlyWallet && (
                <>
                  <RemoteCardCarousel key="remote-cards" />
                  <Separator color="separatorTertiary" thickness={1} />
                </>
              )}
              <InfoCards points={points} />
              {!isReadOnlyWallet && (
                <>
                  <Stack space="16px">
                    <Inset left="4px">
                      <Text weight="bold" color="labelTertiary" size="15pt">
                        {i18n.t(i18n.l.points.points.referral_code)}
                      </Text>
                    </Inset>
                    {referralCode ? (
                      <Columns space="12px">
                        <Column width="1/2">
                          {/* @ts-ignore */}
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
                                >
                                  <Text size="20pt" align="center" color="label" weight="heavy">
                                    {referralCode}
                                  </Text>
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
                            >
                              <Bleed vertical="10px">
                                <MaskedView
                                  style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: 30,
                                    width: 131,
                                  }}
                                  maskElement={
                                    <Box
                                      alignItems="center"
                                      flexDirection="row"
                                      style={{ gap: 4 }}
                                      paddingVertical="10px"
                                      justifyContent="center"
                                    >
                                      <Text align="center" weight="heavy" color="label" size="15pt">
                                        􀈂
                                      </Text>
                                      <Text align="center" weight="heavy" color="label" size="16px / 22px (Deprecated)">
                                        {i18n.t(i18n.l.points.points.share_link)}
                                      </Text>
                                    </Box>
                                  }
                                >
                                  <LinearGradient
                                    style={{
                                      width: 131,
                                      height: '100%',
                                    }}
                                    colors={['#00E7F3', '#57EA5F']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                  />
                                </MaskedView>
                              </Bleed>
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
                  <Separator color="separatorTertiary" thickness={1} />
                </>
              )}
              <Stack space="16px">
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
                    style={{ padding: 1.5, borderRadius: 18 }}
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
                  <Box background="surfaceSecondaryElevated" borderRadius={18} shadow="12px">
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
      </ScrollView>
      <ToastPositionContainer>
        <Toast isVisible={isToastActive} text={`􀁣 ${i18n.t(i18n.l.points.points.referral_code_copied)}`} />
      </ToastPositionContainer>
    </Box>
  );
}
