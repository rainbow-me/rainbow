import React, { memo } from 'react';
import { Box, Separator, Text, TextShadow } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { PolymarketEvent, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { PolymarketTeamInfo } from '@/features/polymarket/types';
import { View } from 'react-native';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';

type PolymarketEventGameInfo = {
  score: string;
  period: string;
  elapsed: string;
  teams?: PolymarketTeamInfo[];
};

export const GameBoxScore = memo(function GameBoxScore({ initialEvent }: { initialEvent: PolymarketMarketEvent | PolymarketEvent }) {
  const fetchedEvent = usePolymarketEventStore(state => state.getData());
  const event = fetchedEvent ?? initialEvent;
  const gameStatus = getGameStatus(event);

  const gameInfo: PolymarketEventGameInfo = {
    score: event.score ?? '',
    period: event.period ?? '',
    elapsed: event.elapsed ?? '',
    teams: event.teams,
  };

  return (
    <Box>
      {gameStatus === 'upcoming' && <UpcomingGameBoxScore gameInfo={gameInfo} />}
      {gameStatus === 'live' && <LiveGameBoxScore gameInfo={gameInfo} />}
      {gameStatus === 'ended' && <EndedGameBoxScore gameInfo={gameInfo} />}
    </Box>
  );
});

const UpcomingGameBoxScore = memo(function UpcomingGameBoxScore({ gameInfo }: { gameInfo: PolymarketEventGameInfo }) {
  const { teams } = gameInfo;

  const teamA = teams?.[0];
  const teamB = teams?.[1];

  return (
    <Box height={125} flexDirection="row" alignItems="center" justifyContent="center" gap={22}>
      <Box gap={12} alignItems="center" width={120}>
        {teamA?.logo && (
          <ImgixImage enableFasterImage size={32} source={{ uri: teamA.logo }} style={{ height: 32, width: 32, borderRadius: 8 }} />
        )}
        <Text size="17pt" weight="bold" color="label" align="center">
          {teamA?.name}
        </Text>
      </Box>
      <Text size="13pt" weight="bold" color="labelQuaternary">
        {'VS'}
      </Text>
      <Box gap={12} alignItems="center" width={120}>
        {teamB?.logo && (
          <ImgixImage enableFasterImage size={32} source={{ uri: teamB.logo }} style={{ height: 32, width: 32, borderRadius: 8 }} />
        )}
        <Text size="17pt" weight="bold" color="label" align="center">
          {teamB?.name}
        </Text>
      </Box>
    </Box>
  );
});

const LiveGameBoxScore = memo(function LiveGameBoxScore({ gameInfo }: { gameInfo: PolymarketEventGameInfo }) {
  const { score, period, elapsed } = gameInfo;
  const { periodTitle } = getGameBoxScore({ score, period, elapsed });

  return (
    <Box gap={20}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
        <View style={{ width: 8, height: 8, backgroundColor: '#E75C29', borderRadius: 4 }} />
        <TextShadow blur={7} shadowOpacity={0.5}>
          <Text size="15pt" weight="heavy" color={{ custom: '#E75C29' }}>
            {'LIVE'}
          </Text>
        </TextShadow>
        <Box
          height={26}
          paddingHorizontal={'6px'}
          borderWidth={1}
          borderColor={{ custom: opacityWorklet('#FFFFFF', 0.08) }}
          borderRadius={8}
          justifyContent="center"
        >
          <Text align="center" size="15pt" weight="bold" color="labelQuaternary">
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
    <Box gap={12}>
      <Box flexDirection="row" alignItems="center" gap={10}>
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
      <Box flexDirection="row" alignItems="center" gap={10}>
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
  let periodTitle = `${currentPeriod} ${elapsed ? `- ${elapsed}` : ''}`;

  if ('bestOf' in parsedScore) {
    periodTitle = `Game ${currentPeriod} - Best of ${parsedScore.bestOf}`;
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
  const bestOf = parseInt(bestOfPart.split('Bo')[1]);
  return {
    teamAScore,
    teamBScore,
    bestOf,
  };
}
