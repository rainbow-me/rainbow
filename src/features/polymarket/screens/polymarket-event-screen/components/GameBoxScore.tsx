import React, { memo, useEffect, useState } from 'react';
import { Box, globalColors, Separator, Text, TextShadow } from '@/design-system';
import { PolymarketEvent, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import * as i18n from '@/languages';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import Animated from 'react-native-reanimated';
import { DEFAULT_MOUNT_ANIMATIONS } from '@/components/utilities/MountWhenFocused';
import { View } from 'react-native';
import { time } from '@/utils/time';
import { usePolymarketLiveGame } from '@/features/polymarket/hooks/usePolymarketLiveGame';
import { formatTimestampParts, toUnixTime } from '@/worklets/dates';
import { parsePeriod, parseScore, selectGameInfo, type PolymarketEventGameInfo } from '@/features/polymarket/utils/sports';
import { TeamLogo } from '@/features/polymarket/components/TeamLogo';

export const GameBoxScore = memo(function GameBoxScore({ event }: { event: PolymarketMarketEvent | PolymarketEvent }) {
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const liveGame = usePolymarketLiveGame(event.gameId);
  const gameInfo = selectGameInfo({ event, liveGame });
  const gameStatus = getGameStatus(gameInfo);
  const teamsLoaded = Boolean(gameInfo.teams?.[0]?.name && gameInfo.teams?.[1]?.name);

  useEffect(() => {
    if (teamsLoaded) return;
    const timer = setTimeout(() => setShowPlaceholder(false), time.seconds(3));
    return () => clearTimeout(timer);
  }, [teamsLoaded]);

  if (!teamsLoaded && !showPlaceholder) return null;

  const statusBoxScore = (
    <>
      {gameStatus === 'upcoming' && <UpcomingGameBoxScore gameInfo={gameInfo} />}
      {gameStatus === 'live' && <LiveGameBoxScore gameInfo={gameInfo} />}
      {gameStatus === 'ended' && <EndedGameBoxScore gameInfo={gameInfo} />}
    </>
  );

  return (
    <View>
      {!teamsLoaded && (
        <View pointerEvents="none" style={{ opacity: 0 }}>
          {statusBoxScore}
        </View>
      )}
      {teamsLoaded && <Animated.View entering={DEFAULT_MOUNT_ANIMATIONS.entering}>{statusBoxScore}</Animated.View>}
    </View>
  );
});

const UpcomingGameBoxScore = memo(function UpcomingGameBoxScore({ gameInfo }: { gameInfo: PolymarketEventGameInfo }) {
  const { teams } = gameInfo;

  const teamA = teams?.[0];
  const teamB = teams?.[1];

  const startTimeParts = gameInfo.startTime
    ? formatTimestampParts(toUnixTime(gameInfo.startTime), { case: 'uppercase', prefixSingleDigitsWithZero: false })
    : undefined;

  return (
    <Box flexDirection="row" alignItems="center" height={80} justifyContent="center" gap={22}>
      <Box gap={12} alignItems="center" width={120}>
        {teamA && <TeamLogo team={teamA} size={32} borderRadius={8} />}
        <Text size="17pt" weight="bold" color="label" align="center">
          {teamA?.alias ?? teamA?.name}
        </Text>
      </Box>
      {startTimeParts ? (
        <Box gap={12} alignItems="center">
          <Text size="15pt" weight="bold" color="labelQuaternary">
            {startTimeParts.date}
          </Text>
          <Text size="15pt" weight="bold" color="labelQuaternary">
            {startTimeParts.time}
          </Text>
        </Box>
      ) : (
        <Text size="15pt" weight="bold" color="labelQuaternary">
          {i18n.t(i18n.l.predictions.sports.vs)}
        </Text>
      )}
      <Box gap={12} alignItems="center" width={120}>
        {teamB && <TeamLogo team={teamB} size={32} borderRadius={8} />}
        <Text size="17pt" weight="bold" color="label" align="center">
          {teamB?.alias ?? teamB?.name}
        </Text>
      </Box>
    </Box>
  );
});

const LiveGameBoxScore = memo(function LiveGameBoxScore({ gameInfo }: { gameInfo: PolymarketEventGameInfo }) {
  const { score, period, elapsed } = gameInfo;
  const { periodTitle } = getGameBoxScore({ score, period, elapsed });

  return (
    <Box gap={12}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={10}>
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
          <Box width={8} height={8} backgroundColor={'#FF584D'} borderRadius={4} />
          <TextShadow blur={14} shadowOpacity={0.5}>
            <Text align="center" size="15pt" style={{ letterSpacing: 0.8 }} weight="heavy" color={{ custom: '#FF584D' }}>
              {i18n.t(i18n.l.predictions.sports.live).toUpperCase()}
            </Text>
          </TextShadow>
        </Box>
        <Box
          background="fillTertiary"
          height={26}
          paddingHorizontal={{ custom: 7 }}
          borderWidth={THICKER_BORDER_WIDTH}
          borderColor="separatorSecondary"
          borderRadius={10}
          justifyContent="center"
        >
          <Text align="right" size="15pt" weight="bold" color="labelTertiary">
            {periodTitle}
          </Text>
        </Box>
      </Box>
      <TeamScores gameInfo={gameInfo} />
    </Box>
  );
});

const EndedGameBoxScore = memo(function EndedGameBoxScore({ gameInfo }: { gameInfo: PolymarketEventGameInfo }) {
  return <TeamScores gameInfo={gameInfo} />;
});

const TeamScores = memo(function TeamScores({ gameInfo }: { gameInfo: PolymarketEventGameInfo }) {
  const { score, elapsed, period, teams } = gameInfo;
  const { teamAScore, teamBScore } = getGameBoxScore({ score, period, elapsed });

  const teamA = teams?.[0];
  const teamB = teams?.[1];

  return (
    <Box
      gap={12}
      backgroundColor={opacityWorklet(globalColors.white100, 0.02)}
      borderRadius={24}
      borderWidth={THICKER_BORDER_WIDTH}
      borderColor="separatorSecondary"
      paddingHorizontal={'16px'}
      paddingVertical={'12px'}
    >
      <Box flexDirection="row" alignItems="center" gap={10} height={28}>
        {teamA && <TeamLogo team={teamA} size={24} borderRadius={4} />}
        <Text size="17pt" weight="bold" color="label" style={{ flex: 1 }}>
          {teamA?.name}
        </Text>
        <Text size="17pt" weight="bold" color="label">
          {teamAScore}
        </Text>
      </Box>
      <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
      <Box flexDirection="row" alignItems="center" gap={10} height={28}>
        {teamB && <TeamLogo team={teamB} size={24} borderRadius={4} />}
        <Text size="17pt" weight="bold" color="label" style={{ flex: 1 }}>
          {teamB?.name}
        </Text>
        <Text size="17pt" weight="bold" color="label">
          {teamBScore}
        </Text>
      </Box>
    </Box>
  );
});

function getGameStatus(gameInfo: PolymarketEventGameInfo) {
  const { live, ended } = gameInfo;
  if (live) return 'live';
  if (ended) return 'ended';
  return 'upcoming';
}

function getGameBoxScore({ score, period, elapsed }: { score: string; period: string; elapsed?: string }) {
  const parsedScore = parseScore(score);
  const { currentPeriod } = parsePeriod(period);
  let periodTitle = `${currentPeriod} ${elapsed ? `· ${elapsed}` : ''}`;

  if ('bestOf' in parsedScore && parsedScore.bestOf !== undefined) {
    periodTitle = i18n.t(i18n.l.predictions.sports.game_best_of, { currentPeriod, bestOf: String(parsedScore.bestOf) });
  }

  return {
    teamAScore: parsedScore.teamAScore,
    teamBScore: parsedScore.teamBScore,
    periodTitle,
  };
}
