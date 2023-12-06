import React from 'react';
import { RefreshControl, Share } from 'react-native';
import { FloatingEmojis } from '@/components/floating-emojis';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Column,
  Columns,
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
import { ScrollView } from 'react-native-gesture-handler';
import MaskedView from '@react-native-masked-view/masked-view';
import BlurredRainbow from '@/assets/blurredRainbow.png';
import Planet from '@/assets/planet.png';
import LinearGradient from 'react-native-linear-gradient';
import { isENSNFTRecord, safeAreaInsetValues } from '@/utils';
import {
  ButtonPressAnimation,
  ShimmerAnimation,
} from '@/components/animations';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { useRecoilState } from 'recoil';
import * as i18n from '@/languages';
import { usePoints } from '@/resources/points';
import { isNil } from 'lodash';
import { getFormattedTimeQuantity } from '@/helpers/utilities';
import { address as formatAddress } from '@/utils/abbreviations';
import { delay } from '@/utils/delay';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '@/utils/profileUtils';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { Page } from '@/components/layout';
import { IS_ANDROID } from '@/env';
import { ImgixImage } from '@/components/images';
import { Source } from 'react-native-fast-image';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';

const ONE_WEEK_MS = 604_800_000;

const displayNextDistribution = (seconds: number) => {
  const days = [
    i18n.t(i18n.l.points.points.sunday),
    i18n.t(i18n.l.points.points.monday),
    i18n.t(i18n.l.points.points.tuesday),
    i18n.t(i18n.l.points.points.wednesday),
    i18n.t(i18n.l.points.points.thursday),
    i18n.t(i18n.l.points.points.friday),
    i18n.t(i18n.l.points.points.saturday),
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
    default:
      icon = `#${rank}`;
      break;
  }

  const formattedPoints = points.toLocaleString('en-US');

  return (
    <Box
      paddingVertical="10px"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Inline space="10px" alignVertical="center">
        {avatarURL && !isENSNFTRecord(avatarURL) ? (
          <ImageAvatar image={avatarURL} size="rewards" />
        ) : (
          <ContactAvatar
            color={
              colors.avatarBackgrounds[addressHashedColorIndex(address) ?? 0]
            }
            size="rewards"
            value={addressHashedEmoji(address)}
          />
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
          {/* <Inline space="2px" alignVertical="center">
              <Text color="labelQuaternary" size="11pt" weight="bold">
                􀙬
              </Text>
              <Text color="labelQuaternary" size="13pt" weight="semibold">
                {`40 ${i18n.t(i18n.l.points.points.days)}`}
              </Text>
            </Inline> */}
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
        <Box width={{ custom: 32 }} alignItems="flex-end">
          <Text
            align="center"
            // eslint-disable-next-line no-nested-ternary
            size={rank >= 100 ? '11pt' : rank > 3 ? '13pt' : '15pt'}
            color="labelTertiary"
            weight={rank <= 3 ? 'semibold' : 'heavy'}
            containsEmoji={rank <= 3}
          >
            {icon}
          </Text>
        </Box>
      </Inline>
    </Box>
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
  // onPress,
  title,
  subtitle,
  mainText,
  icon,
  accentColor,
}: {
  // onPress: () => void;
  title: string;
  subtitle: string;
  mainText: string;
  icon: string;
  accentColor: string;
}) => (
  // <ButtonPressAnimation onPress={onPress} overflowMargin={50}>
  <Box
    padding="20px"
    background="surfaceSecondaryElevated"
    shadow="12px"
    height={{ custom: 98 }}
    borderRadius={18}
  >
    <Stack space="12px">
      {/* <Inline space="4px" alignVertical="center"> */}
      <Text color="labelSecondary" weight="bold" size="15pt">
        {title}
      </Text>
      {/* <Text color="labelQuaternary" weight="heavy" size="13pt">
            􀅵
          </Text>
        </Inline> */}
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
  // </ButtonPressAnimation>
);

export default function PointsContent() {
  const { colors } = useTheme();
  const { width: deviceWidth } = useDimensions();
  const { accountAddress, accountENS } = useAccountProfile();
  const { setClipboard } = useClipboard();
  const { data, isFetching, dataUpdatedAt, refetch } = usePoints({
    walletAddress: accountAddress,
  });

  const labelSecondary = useForegroundColor('labelSecondary');
  const green = useForegroundColor('green');
  // const pink = useForegroundColor('pink');
  // const yellow = useForegroundColor('yellow');

  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );

  const referralCode = data?.points?.user?.referralCode
    ? data.points.user.referralCode.slice(0, 3) +
      '-' +
      data.points.user.referralCode.slice(3)
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

  const nextDistributionSeconds = data?.points?.meta?.distribution?.next;
  const totalPointsString = data?.points?.user?.earnings?.total.toLocaleString(
    'en-US'
  );
  const totalPointsMaskSize = 60 * Math.max(totalPointsString?.length ?? 0, 4);

  const canDisplayTotalPoints = !isNil(data?.points?.user?.earnings?.total);
  const canDisplayNextRewardCard = !isNil(nextDistributionSeconds);
  const canDisplayCurrentRank = !!data?.points?.user?.stats?.position.current;
  const canDisplayRankCard =
    canDisplayCurrentRank && !!data?.points?.leaderboard?.stats?.total_users;

  const canDisplayLeaderboard = !!data?.points?.leaderboard?.accounts;

  const shouldDisplayError = !isFetching && !data?.points;

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
              <Columns space="12px">
                <Column width="1/2">
                  {canDisplayNextRewardCard ? (
                    <InfoCard
                      // onPress={() => {}}
                      title={i18n.t(i18n.l.points.points.next_drop)}
                      mainText={getFormattedTimeQuantity(
                        nextDistributionSeconds,
                        2
                      )}
                      icon="􀉉"
                      subtitle={displayNextDistribution(
                        nextDistributionSeconds
                      )}
                      accentColor={labelSecondary}
                    />
                  ) : (
                    <Skeleton height={98} width={(deviceWidth - 40 - 12) / 2} />
                  )}
                </Column>
                <Column width="1/2">
                  {canDisplayRankCard ? (
                    <InfoCard
                      // onPress={() => {}}
                      title={i18n.t(i18n.l.points.points.your_rank)}
                      mainText={`#${data?.points?.user?.stats?.position?.current}`}
                      icon="􀉬"
                      subtitle={i18n.t(i18n.l.points.points.out_of_x, {
                        totalUsers: (data?.points?.leaderboard?.stats
                          ?.total_users as number).toLocaleString('en-US'),
                      })}
                      accentColor={green}
                    />
                  ) : (
                    <Skeleton height={98} width={(deviceWidth - 40 - 12) / 2} />
                  )}
                </Column>
              </Columns>
              <Stack space="16px">
                <Inset left="4px">
                  {/* <ButtonPressAnimation>
                    <Inline space="4px" alignVertical="center"> */}
                  <Text weight="bold" color="labelTertiary" size="15pt">
                    {i18n.t(i18n.l.points.points.referral_code)}
                  </Text>
                  {/* <Text weight="heavy" color="labelQuaternary" size="13pt">
                        􀅵
                      </Text>
                    </Inline>
                  </ButtonPressAnimation> */}
                </Inset>
                {referralCode ? (
                  <Columns space="12px">
                    <Column width="1/2">
                      {/* @ts-ignore */}
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
                              shadow="12px"
                              borderRadius={18}
                              height={{ custom: 48 }}
                              width="full"
                              justifyContent="center"
                              alignItems="center"
                            >
                              <Text
                                size="20pt"
                                align="center"
                                color="label"
                                weight="heavy"
                              >
                                {referralCode}
                              </Text>
                            </Box>
                          </ButtonPressAnimation>
                        )}
                      </FloatingEmojis>
                    </Column>
                    <Column width="1/2">
                      <ButtonPressAnimation
                        overflowMargin={50}
                        onPress={() =>
                          Share.share(
                            IS_ANDROID
                              ? {
                                  message: 'rainbow.me',
                                }
                              : {
                                  url: 'rainbow.me',
                                }
                          )
                        }
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
                                  <Text
                                    align="center"
                                    weight="heavy"
                                    color="label"
                                    size="15pt"
                                  >
                                    􀈂
                                  </Text>
                                  <Text
                                    align="center"
                                    weight="heavy"
                                    color="label"
                                    size="16px / 22px (Deprecated)"
                                  >
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
                      <Skeleton
                        width={(deviceWidth - 40 - 12) / 2}
                        height={48}
                      />
                    </Column>
                    <Column width="1/2">
                      <Skeleton
                        width={(deviceWidth - 40 - 12) / 2}
                        height={48}
                      />
                    </Column>
                  </Columns>
                )}
                <Inset horizontal="4px">
                  <Text
                    color="labelQuaternary"
                    size="13pt"
                    weight="semibold"
                    align="left"
                  >
                    {i18n.t(i18n.l.points.points.earn_points_for_referring)}
                  </Text>
                </Inset>
              </Stack>
              <Separator color="separatorTertiary" thickness={1} />
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
                      {data?.points?.leaderboard?.accounts
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
              {i18n.t(i18n.l.points.points.error)}
            </Text>
          </Box>
        )}
      </ScrollView>
      <ToastPositionContainer>
        <Toast
          isVisible={isToastActive}
          text={`􀁣 ${i18n.t(i18n.l.points.points.referral_code_copied)}`}
        />
      </ToastPositionContainer>
    </Box>
  );
}
