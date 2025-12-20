import React, { memo, useEffect, useState } from 'react';
import { ImgixImage } from '@/components/images';
import { Box, globalColors, Separator, Text, TextShadow } from '@/design-system';
import { PolymarketEvent, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { PolymarketTeamInfo } from '@/features/polymarket/types';
import * as i18n from '@/languages';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import Animated from 'react-native-reanimated';
import { DEFAULT_MOUNT_ANIMATIONS } from '@/components/utilities/MountWhenFocused';
import { View } from 'react-native';
import { time } from '@/utils/time';

type PolymarketEventGameInfo = {
  score: string;
  period: string;
  elapsed: string;
  teams?: PolymarketTeamInfo[];
};

export const GameBoxScore = memo(function GameBoxScore({ event }: { event: PolymarketMarketEvent | PolymarketEvent }) {
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const gameStatus = getGameStatus(event);
  const gameInfo: PolymarketEventGameInfo = {
    score: event.score ?? '',
    period: event.period ?? '',
    elapsed: event.elapsed ?? '',
    teams: event.teams,
  };
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

  return (
    <Box flexDirection="row" alignItems="center" height={80} justifyContent="center" gap={22}>
      <Box gap={12} alignItems="center" width={120}>
        {teamA?.logo && (
          <ImgixImage enableFasterImage size={32} source={{ uri: teamA.logo }} style={{ height: 32, width: 32, borderRadius: 8 }} />
        )}
        <Text size="17pt" weight="bold" color="label" align="center">
          {teamA?.alias ?? teamA?.name}
        </Text>
      </Box>
      <Text size="13pt" weight="bold" color="labelQuaternary">
        {i18n.t(i18n.l.predictions.sports.vs)}
      </Text>
      <Box gap={12} alignItems="center" width={120}>
        {teamB?.logo && (
          <ImgixImage enableFasterImage size={32} source={{ uri: teamB.logo }} style={{ height: 32, width: 32, borderRadius: 8 }} />
        )}
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
              {i18n.t(i18n.l.predictions.sports.live)}
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
        {teamA?.logo && (
          <ImgixImage enableFasterImage size={24} source={{ uri: teamA.logo }} style={{ height: 24, width: 24, borderRadius: 8 }} />
        )}
        <Text size="17pt" weight="bold" color="label" style={{ flex: 1 }}>
          {teamA?.name}
        </Text>
        <Text size="17pt" weight="bold" color="label">
          {teamAScore}
        </Text>
      </Box>
      <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
      <Box flexDirection="row" alignItems="center" gap={10} height={28}>
        {teamB?.logo && <ImgixImage size={24} source={{ uri: teamB.logo }} style={{ height: 24, width: 24, borderRadius: 8 }} />}
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

function getGameStatus(event: PolymarketMarketEvent | PolymarketEvent) {
  const { live, ended } = event;
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

function parsePeriod(string: string) {
  const [currentPeriod, totalPeriods] = string.split('/');
  return {
    currentPeriod,
    totalPeriods,
  };
}

function parseScore(string: string) {
  if (string.includes('|')) {
    return parseBestOfScore(string);
  }
  return parseRegularScore(string);
}

function parseRegularScore(string: string) {
  const [teamAScore, teamBScore] = string.split('-');
  return {
    teamAScore,
    teamBScore,
  };
}

// Example: "000-000|1-1|Bo3",
// TODO: Handle UFC format "0-1|KO/TKO"
function parseBestOfScore(string: string) {
  const [_, scorePart, bestOfPart] = string.split('|');
  const [teamAScore, teamBScore] = scorePart.split('-');
  const bestOf = bestOfPart ? parseInt(bestOfPart.split('Bo')[1]) : undefined;
  return {
    teamAScore,
    teamBScore,
    bestOf,
  };
}
