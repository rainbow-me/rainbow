import React from 'react';
import { Image, RefreshControl } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  Easing,
  withDelay,
  interpolate,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import {
  FloatingEmojis,
  FloatingEmojisTapper,
} from '@/components/floating-emojis';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Cover,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
  useBackgroundColor,
  useForegroundColor,
} from '@/design-system';
import { useAccountProfile, useClipboard, useDimensions } from '@/hooks';
import { useTheme } from '@/theme';
import { POINTS, useExperimentalFlag } from '@/config';
import config from '@/model/config';
import { ScrollView } from 'react-native-gesture-handler';
import MaskedView from '@react-native-masked-view/masked-view';
import BlurredRainbow from '@/assets/blurredRainbow.png';
import Planet from '@/assets/planet.png';
import LinearGradient from 'react-native-linear-gradient';
import { IS_TEST } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import {
  ButtonPressAnimation,
  ShimmerAnimation,
} from '@/components/animations';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { useRecoilState } from 'recoil';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import * as i18n from '@/languages';
import { pointsQueryKey, usePoints } from '@/resources/points';
import { maybeSignUri } from '@/handlers/imgix';
import { isNil } from 'lodash';
import { getFormattedTimeQuantity } from '@/helpers/utilities';
import { address as formatAddress } from '@/utils/abbreviations';
import { queryClient } from '@/react-query';
import { delay } from '@/utils/delay';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '@/utils/profileUtils';

const STREAKS_ENABLED = true;
const REFERRALS_ENABLED = true;
const ONE_WEEK_MS = 604_800_000;

const fallConfig = {
  duration: 2000,
  easing: Easing.bezier(0.2, 0, 0, 1),
};
const jumpConfig = {
  duration: 500,
  easing: Easing.bezier(0.2, 0, 0, 1),
};
const flyUpConfig = {
  duration: 2500,
  easing: Easing.bezier(0.05, 0.7, 0.1, 1.0),
};

const displayNextDistribution = (seconds: number) => {
  const days = [
    i18n.t(i18n.l.points.sunday),
    i18n.t(i18n.l.points.monday),
    i18n.t(i18n.l.points.tuesday),
    i18n.t(i18n.l.points.wednesday),
    i18n.t(i18n.l.points.thursday),
    i18n.t(i18n.l.points.friday),
    i18n.t(i18n.l.points.saturday),
  ];

  const ms = seconds * 1000;
  const date = new Date(ms);
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  if (ms - Date.now() > ONE_WEEK_MS) {
    return `${hours}${ampm} ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  } else {
    const dayOfWeek = days[date.getDay()];

    return `${hours}${ampm} ${dayOfWeek}`;
  }
};

const LeaderboardRow = ({
  address,
  ens,
  avatarURL,
  points,
  rank,
}: {
  address: string;
  ens?: string;
  avatarURL?: string;
  points: number;
  rank: number;
}) => {
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  let gradient;
  let icon;
  switch (rank) {
    case 1:
      gradient = ['#FFE456', '#CF9500'];
      icon = '🥇';
      break;
    case 2:
      gradient = ['#FBFCFE', '#B3BCC7'];
      icon = '🥈';
      break;
    case 3:
      gradient = ['#DE8F38', '#AE5F25'];
      icon = '🥉';
      break;
    case 4:
      icon = '􀁀';
      break;
    case 5:
      icon = '􀁂';
      break;
    case 6:
      icon = '􀁄';
      break;
    case 7:
      icon = '􀁆';
      break;
    case 8:
      icon = '􀁈';
      break;
    case 9:
      icon = '􀁊';
      break;
    case 10:
      icon = '􀓵';
      break;
    default:
      icon = '􀁜';
      break;
  }

  const formattedPoints = points.toLocaleString('en-US');

  return (
    <ButtonPressAnimation
      onPress={() =>
        navigate(Routes.PROFILE_SHEET, {
          address: ens ?? address,
          fromRoute: 'PointsScreen',
        })
      }
    >
      <Box
        paddingVertical="10px"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Inline space="10px" alignVertical="center">
          {avatarURL ? (
            <Box
              as={Image}
              source={{ uri: maybeSignUri(avatarURL) }}
              style={{ width: 36, height: 36 }}
              borderRadius={18}
              background="surfaceSecondaryElevated"
              shadow="12px"
            />
          ) : (
            <AccentColorProvider
              color={
                colors.avatarBackgrounds[addressHashedColorIndex(address) ?? 0]
              }
            >
              <Box
                style={{
                  width: 36,
                  height: 36,
                }}
                background="accent"
                borderRadius={18}
                shadow="12px"
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  align="center"
                  weight="bold"
                  size="20pt"
                  color="labelTertiary"
                  containsEmoji
                >
                  {addressHashedEmoji(address) ?? '􀉪'}
                </Text>
              </Box>
            </AccentColorProvider>
          )}
          <Stack space="8px">
            <Box style={{ maxWidth: 145 }}>
              <Text
                color="label"
                weight="bold"
                size="15pt"
                ellipsizeMode="middle"
                numberOfLines={1}
              >
                {ens ? ens : formatAddress(address, 4, 5)}
              </Text>
            </Box>
            {STREAKS_ENABLED && (
              <Inline space="2px" alignVertical="center">
                <Text color="labelQuaternary" size="11pt" weight="bold">
                  􀙬
                </Text>
                <Text color="labelQuaternary" size="13pt" weight="semibold">
                  {`40 ${i18n.t(i18n.l.points.days)}`}
                </Text>
              </Inline>
            )}
          </Stack>
        </Inline>
        <Inline space="8px" alignVertical="center">
          {rank <= 3 && gradient ? (
            <Bleed vertical="10px">
              <MaskedView
                style={{ height: 30, alignItems: 'center' }}
                maskElement={
                  <Box paddingVertical="10px" justifyContent="center">
                    <Text align="right" weight="bold" color="label" size="15pt">
                      {formattedPoints}
                    </Text>
                  </Box>
                }
              >
                <LinearGradient
                  style={{ width: 100, height: '100%' }}
                  colors={gradient}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
              </MaskedView>
            </Bleed>
          ) : (
            <Text align="right" weight="bold" color="labelTertiary" size="15pt">
              {formattedPoints}
            </Text>
          )}
          <Text
            align="center"
            weight="semibold"
            color="labelTertiary"
            size="15pt"
            containsEmoji={rank <= 3}
          >
            {icon}
          </Text>
        </Inline>
      </Box>
    </ButtonPressAnimation>
  );
};

const Skeleton = ({ width, height }: { width: number; height: number }) => {
  const { isDarkMode, colors } = useTheme();

  const surfaceSecondaryElevated = useBackgroundColor(
    'surfaceSecondaryElevated'
  );
  const surfaceSecondary = useBackgroundColor('surfaceSecondary');

  const skeletonColor = isDarkMode
    ? surfaceSecondaryElevated
    : surfaceSecondary;

  return (
    <AccentColorProvider color={skeletonColor}>
      <Box
        background="accent"
        height={{ custom: height }}
        width={{ custom: width }}
        borderRadius={18}
        style={{ overflow: 'hidden' }}
      >
        <ShimmerAnimation
          color={colors.alpha(colors.blueGreyDark, 0.06)}
          width={width}
          // @ts-ignore
          gradientColor={colors.alpha(colors.blueGreyDark, 0.06)}
        />
      </Box>
    </AccentColorProvider>
  );
};

const InfoCard = ({
  onPress,
  title,
  subtitle,
  mainText,
  icon,
  accentColor,
}: {
  onPress: () => void;
  title: string;
  subtitle: string;
  mainText: string;
  icon: string;
  accentColor: string;
}) => (
  <ButtonPressAnimation onPress={onPress} overflowMargin={50}>
    <Box
      padding="20px"
      background="surfaceSecondaryElevated"
      shadow="12px"
      height={{ custom: 98 }}
      borderRadius={18}
    >
      <Stack space="12px">
        <Inline space="4px" alignVertical="center">
          <Text color="labelSecondary" weight="bold" size="15pt">
            {title}
          </Text>
          <Text color="labelQuaternary" weight="heavy" size="13pt">
            􀅵
          </Text>
        </Inline>
        <Text color="label" weight="heavy" size="22pt">
          {mainText}
        </Text>
        <Inline space="4px">
          <Text
            align="center"
            weight="heavy"
            size="12pt"
            color={{ custom: accentColor }}
          >
            {icon}
          </Text>
          <Text weight="heavy" size="13pt" color={{ custom: accentColor }}>
            {subtitle}
          </Text>
        </Inline>
      </Stack>
    </Box>
  </ButtonPressAnimation>
);

export default function PointsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const {
    accountAddress,
    accountImage,
    accountColor,
    accountSymbol,
    accountENS,
  } = useAccountProfile();
  const pointsFullyEnabled =
    useExperimentalFlag(POINTS) || config.points_fully_enabled;
  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();
  const { data, isFetching, dataUpdatedAt } = usePoints({
    walletAddress: accountAddress,
  });

  const iconState = useSharedValue(1);
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [0.75, 0.7, 0.65, 0.55, 0.75, 0.7, 0.65, 0.55, 0.75]
    );
    const rotate = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [-12, -4, -12, -12, -372, -380, -372, -372, -12]
    );
    const translateX = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [0, 4, 0, 0, 0, -4, 0, 0, 0]
    );
    const translateY = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [-20, -5, 10, 14, -20, -5, 10, 14, -20]
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  React.useEffect(() => {
    if (IS_TEST) return;

    progress.value = 0;
    progress.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, fallConfig),
          withTiming(2, fallConfig),
          withTiming(3, jumpConfig),
          withTiming(4, flyUpConfig),
          withTiming(5, fallConfig),
          withTiming(6, fallConfig),
          withTiming(7, jumpConfig),
          withTiming(8, flyUpConfig)
        ),
        -1,
        false
      )
    );
  }, [progress]);

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const labelSecondary = useForegroundColor('labelSecondary');
  const pink = useForegroundColor('pink');
  const yellow = useForegroundColor('yellow');

  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );

  const onPressCopy = React.useCallback(
    (onNewEmoji: () => void) => {
      if (!isToastActive) {
        setToastActive(true);
        setTimeout(() => {
          setToastActive(false);
        }, 2000);
      }
      onNewEmoji();
      setClipboard(accountAddress);
    },
    [accountAddress, isToastActive, setClipboard, setToastActive]
  );

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    if (!dataUpdatedAt || Date.now() - dataUpdatedAt > 30_000) {
      await queryClient.invalidateQueries(
        pointsQueryKey({ address: accountAddress })
      );
    }
    await delay(2000);
    setIsRefreshing(false);
  }, [accountAddress, dataUpdatedAt]);

  const nextDistributionSeconds = data?.points?.meta?.distribution?.next;
  const totalPointsString = data?.points?.user?.earnings?.total.toLocaleString(
    'en-US'
  );
  const totalPointsMaskSize = 50 * Math.max(totalPointsString?.length ?? 0, 4);

  const canDisplayTotalPoints = !isNil(data?.points?.user?.earnings?.total);
  const canDisplayNextRewardCard = !isNil(nextDistributionSeconds);
  const canDisplayStreakCard = STREAKS_ENABLED;
  const canDisplayReferralsCard = REFERRALS_ENABLED;
  const canDisplayCards =
    canDisplayNextRewardCard || canDisplayStreakCard || canDisplayReferralsCard;
  const canDisplayReferralLink = REFERRALS_ENABLED;
  const canDisplayCurrentRank = !isNil(
    data?.points?.user?.stats?.position.current
  );
  const canDisplayLeaderboard = !!data?.points?.leaderboard?.accounts;

  const shouldDisplayError = !isFetching && !data?.points;

  return (
    <Box as={Page} flex={1} testID="points-screen" width="full">
      <Navbar
        hasStatusBarInset
        leftComponent={
          pointsFullyEnabled && (
            <ButtonPressAnimation
              onPress={onChangeWallet}
              scaleTo={0.8}
              overflowMargin={50}
            >
              {accountImage ? (
                <ImageAvatar
                  image={accountImage}
                  marginRight={10}
                  size="header"
                />
              ) : (
                <ContactAvatar
                  color={accountColor}
                  marginRight={10}
                  size="small"
                  value={accountSymbol}
                />
              )}
            </ButtonPressAnimation>
          )
        }
        title={i18n.t(i18n.l.account.tab_points)}
      />
      {pointsFullyEnabled ? (
        <ScrollView
          scrollIndicatorInsets={{
            bottom: TAB_BAR_HEIGHT - safeAreaInsetValues.bottom,
          }}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_HEIGHT + 32,
            height: !shouldDisplayError ? undefined : '100%',
          }}
          showsVerticalScrollIndicator={!shouldDisplayError}
          refreshControl={
            <RefreshControl
              onRefresh={refresh}
              refreshing={isRefreshing}
              tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
            />
          }
        >
          {!shouldDisplayError ? (
            <Inset horizontal="20px" top="10px">
              <Stack space="32px">
                <Bleed bottom={{ custom: 14 }}>
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    height={{ custom: 51 }}
                    paddingLeft="4px"
                  >
                    {canDisplayTotalPoints ? (
                      <MaskedView
                        style={{
                          alignItems: 'center',
                          height: 51,
                          maxWidth: deviceWidth - 60 - 20 - 20,
                        }}
                        maskElement={
                          <Box paddingVertical="10px">
                            <Text color="label" size="44pt" weight="heavy">
                              {totalPointsString}
                            </Text>
                          </Box>
                        }
                      >
                        <Image
                          source={BlurredRainbow}
                          style={{
                            width: totalPointsMaskSize,
                            height: totalPointsMaskSize,
                            left: -100,
                            top:
                              -totalPointsMaskSize +
                              (totalPointsString?.length ?? 0) * 5 +
                              80,
                          }}
                        />
                      </MaskedView>
                    ) : (
                      <Skeleton height={31} width={200} />
                    )}
                    <Cover>
                      <Box
                        alignItems="flex-end"
                        width="full"
                        justifyContent="center"
                        height="full"
                        paddingRight="4px"
                      >
                        <Image
                          source={Planet}
                          style={{
                            width: 60.19,
                            height: 36,
                          }}
                        />
                      </Box>
                    </Cover>
                  </Box>
                </Bleed>
                <Bleed space="20px">
                  <ScrollView
                    horizontal
                    contentContainerStyle={{ gap: 12, padding: 20 }}
                    showsHorizontalScrollIndicator={false}
                  >
                    {canDisplayCards ? (
                      <>
                        {canDisplayNextRewardCard && (
                          <InfoCard
                            onPress={() => {}}
                            title={i18n.t(i18n.l.points.next_reward)}
                            mainText={getFormattedTimeQuantity(
                              nextDistributionSeconds
                            )}
                            icon="􀉉"
                            subtitle={displayNextDistribution(
                              nextDistributionSeconds
                            )}
                            accentColor={labelSecondary}
                          />
                        )}
                        {canDisplayStreakCard && (
                          <InfoCard
                            onPress={() => {}}
                            title={i18n.t(i18n.l.points.streak)}
                            mainText={`36 ${i18n.t(i18n.l.points.days)}`}
                            icon="􀙬"
                            subtitle={i18n.t(i18n.l.points.longest_yet)}
                            accentColor={pink}
                          />
                        )}
                        {canDisplayReferralsCard && (
                          <InfoCard
                            onPress={() => {}}
                            title={i18n.t(i18n.l.points.referrals)}
                            mainText="12"
                            icon="􀇯"
                            subtitle={`${(8200).toLocaleString(
                              'en-US'
                            )} ${i18n.t(i18n.l.points.points)}`}
                            accentColor={yellow}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <Skeleton height={98} width={140} />
                        <Skeleton height={98} width={140} />
                        <Skeleton height={98} width={140} />
                      </>
                    )}
                  </ScrollView>
                </Bleed>
                {REFERRALS_ENABLED && (
                  <Stack space={{ custom: 14 }}>
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="space-between"
                      paddingHorizontal="4px"
                    >
                      <ButtonPressAnimation>
                        <Inline space="4px" alignVertical="center">
                          <Text weight="bold" color="labelTertiary" size="15pt">
                            {i18n.t(i18n.l.points.referral_link)}
                          </Text>
                          <Text
                            weight="heavy"
                            color="labelQuaternary"
                            size="13pt"
                          >
                            􀅵
                          </Text>
                        </Inline>
                      </ButtonPressAnimation>
                      <ButtonPressAnimation>
                        <Bleed vertical="10px">
                          <MaskedView
                            style={{
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              height: 30,
                            }}
                            maskElement={
                              <Box
                                alignItems="center"
                                flexDirection="row"
                                style={{ gap: 4 }}
                                paddingVertical="10px"
                                justifyContent="flex-end"
                              >
                                <Text
                                  align="right"
                                  weight="heavy"
                                  color="label"
                                  size="13pt"
                                >
                                  􀈂
                                </Text>
                                <Text
                                  align="right"
                                  weight="heavy"
                                  color="label"
                                  size="15pt"
                                >
                                  {i18n.t(i18n.l.points.share)}
                                </Text>
                              </Box>
                            }
                          >
                            <LinearGradient
                              style={{
                                width: 65,
                                height: '100%',
                              }}
                              colors={['#00E7F3', '#57EA5F']}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                            />
                          </MaskedView>
                        </Bleed>
                      </ButtonPressAnimation>
                    </Box>
                    {canDisplayReferralLink ? (
                      // @ts-ignore
                      <FloatingEmojis
                        distance={250}
                        duration={500}
                        fadeOut={false}
                        scaleTo={0}
                        size={50}
                        wiggleFactor={0}
                      >
                        {({ onNewEmoji }: { onNewEmoji: () => void }) => (
                          <ButtonPressAnimation
                            onPress={() => onPressCopy(onNewEmoji)}
                            overflowMargin={50}
                          >
                            <Box
                              background="surfaceSecondaryElevated"
                              paddingVertical="12px"
                              paddingHorizontal="16px"
                              shadow="12px"
                              borderRadius={18}
                              alignItems="center"
                              flexDirection="row"
                              style={{ gap: 6, height: 48 }}
                            >
                              <Text
                                color="labelTertiary"
                                size="15pt"
                                weight="bold"
                              >
                                􀉣
                              </Text>
                              <Box style={{ width: deviceWidth - 98 }}>
                                <Text
                                  color="labelTertiary"
                                  size="17pt"
                                  weight="semibold"
                                  numberOfLines={1}
                                >
                                  rainbow.me/points?ref=0x2e6786983232jkl
                                </Text>
                              </Box>
                            </Box>
                          </ButtonPressAnimation>
                        )}
                      </FloatingEmojis>
                    ) : (
                      <Skeleton width={deviceWidth - 40} height={48} />
                    )}
                  </Stack>
                )}
                <Separator color="separatorTertiary" thickness={1} />
                <Stack space="16px">
                  <Inset left="4px">
                    <Text color="label" size="20pt" weight="heavy">
                      {i18n.t(i18n.l.points.leaderboard)}
                    </Text>
                  </Inset>
                  {canDisplayCurrentRank ? (
                    <Box
                      background="surfaceSecondaryElevated"
                      shadow="12px"
                      as={LinearGradient}
                      style={{ padding: 1.5, borderRadius: 18 }}
                      colors={[
                        '#31BCC4',
                        '#57EA5F',
                        '#F0D83F',
                        '#DF5337',
                        '#B756A7',
                      ]}
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
                          <Text
                            color="label"
                            size="17pt"
                            weight="heavy"
                            numberOfLines={1}
                            ellipsizeMode="middle"
                          >
                            {accountENS
                              ? accountENS
                              : formatAddress(accountAddress, 4, 5)}
                          </Text>
                        </Box>
                        <Text color="label" size="17pt" weight="heavy">
                          {`#${data?.points?.user?.stats?.position.current.toLocaleString(
                            'en-US'
                          )}`}
                        </Text>
                      </Box>
                    </Box>
                  ) : (
                    <Skeleton width={deviceWidth - 40} height={51} />
                  )}
                  {canDisplayLeaderboard ? (
                    <Box
                      background="surfaceSecondaryElevated"
                      borderRadius={18}
                      paddingHorizontal="16px"
                      shadow="12px"
                    >
                      <Stack
                        separator={
                          <Separator color="separatorTertiary" thickness={1} />
                        }
                      >
                        {data?.points?.leaderboard?.accounts?.map(
                          (account, index) => (
                            <LeaderboardRow
                              address={account.address}
                              ens={account.ens}
                              avatarURL={account.avatarURL}
                              points={account.earnings.total}
                              rank={index + 1}
                              key={account.address}
                            />
                          )
                        )}
                      </Stack>
                    </Box>
                  ) : (
                    <Skeleton height={400} width={deviceWidth - 40} />
                  )}
                </Stack>
              </Stack>
            </Inset>
          ) : (
            <Box
              alignItems="center"
              justifyContent="center"
              height="full"
              width="full"
            >
              <Text
                size="17pt"
                weight="bold"
                align="center"
                color="labelTertiary"
              >
                {i18n.t(i18n.l.points.error)}
              </Text>
            </Box>
          )}
        </ScrollView>
      ) : (
        <>
          <Box
            alignItems="center"
            as={Page}
            flex={1}
            position="absolute"
            height="full"
            width="full"
            style={{ zIndex: -1 }}
            justifyContent="center"
          >
            <Box paddingBottom="104px" width="full">
              <Stack alignHorizontal="center" space="28px">
                <Box
                  alignItems="center"
                  as={Animated.View}
                  justifyContent="center"
                  style={[{ height: 28, width: 28 }, animatedStyle]}
                >
                  <TabBarIcon
                    accentColor={accountColor}
                    hideShadow
                    icon="tabPoints"
                    index={1}
                    reanimatedPosition={iconState}
                    size={56}
                    tintBackdrop={colors.white}
                    tintOpacity={isDarkMode ? 0.25 : 0.1}
                  />
                </Box>
                <Stack alignHorizontal="center" space="20px">
                  <Text
                    align="center"
                    color="labelTertiary"
                    size="26pt"
                    weight="semibold"
                  >
                    {i18n.t(i18n.l.points.coming_soon_title)}
                  </Text>
                  <Text
                    align="center"
                    color="labelQuaternary"
                    size="15pt"
                    weight="medium"
                  >
                    {i18n.t(i18n.l.points.coming_soon_description)}
                  </Text>
                </Stack>
              </Stack>
            </Box>
          </Box>
          <Box
            as={FloatingEmojisTapper}
            distance={500}
            duration={4000}
            emojis={[
              'rainbow',
              'rainbow',
              'rainbow',
              'slot_machine',
              'slot_machine',
            ]}
            gravityEnabled
            position="absolute"
            range={[0, 0]}
            size={80}
            wiggleFactor={0}
            yOffset={-66}
          >
            <Box
              position="absolute"
              style={{
                height: deviceHeight,
                width: deviceWidth,
              }}
            />
          </Box>
        </>
      )}
      <ToastPositionContainer>
        <Toast isVisible={isToastActive} text="􀁣 Link Copied" />
      </ToastPositionContainer>
    </Box>
  );
}
