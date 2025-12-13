import React, { memo } from 'react';
import { Box, Separator, Text, TextShadow } from '@/design-system';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { ImgixImage } from '@/components/images';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

export const GameBoxScore = memo(function GameBoxScore() {
  const event = usePolymarketEventStore(state => state.getData());
  // TODO: Add loading state
  if (!event) return null;

  const gameStatus = getGameStatus(event);

  return (
    <Box>
      {gameStatus === 'upcoming' && <UpcomingGameBoxScore event={event} />}
      {gameStatus === 'live' && <LiveGameBoxScore event={event} />}
      {gameStatus === 'ended' && <EndedGameBoxScore event={event} />}
    </Box>
  );
});

const UpcomingGameBoxScore = memo(function UpcomingGameBoxScore({ event }: { event: PolymarketEvent }) {
  const teamA = event.teams?.[0];
  const teamB = event.teams?.[1];
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="center" gap={22}>
      <Box gap={12} alignItems="center" width={120}>
        <ImgixImage enableFasterImage size={60} source={{ uri: teamA?.logo }} style={{ height: 60, width: 60, borderRadius: 16 }} />
        <Text size="17pt" weight="bold" color="label">
          {teamA?.name}
        </Text>
      </Box>
      <Text size="13pt" weight="bold" color="labelQuaternary">
        {'VS'}
      </Text>
      <Box gap={12} alignItems="center" width={120}>
        <ImgixImage enableFasterImage size={60} source={{ uri: teamB?.logo }} style={{ height: 60, width: 60, borderRadius: 16 }} />
        <Text size="17pt" weight="bold" color="label">
          {teamB?.name}
        </Text>
      </Box>
    </Box>
  );
});

const LiveGameBoxScore = memo(function LiveGameBoxScore({ event }: { event: PolymarketEvent }) {
  const { periodTitle } = getGameBoxScore(event);

  return (
    <Box gap={20}>
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
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
      <TeamScores event={event} />
    </Box>
  );
});

const EndedGameBoxScore = memo(function EndedGameBoxScore({ event }: { event: PolymarketEvent }) {
  return <TeamScores event={event} />;
});

const TeamScores = memo(function TeamScores({ event }: { event: PolymarketEvent }) {
  const { score, elapsed, period } = event;
  const { teamAScore, teamBScore } = getGameBoxScore({ score, period, elapsed });

  const teamA = event.teams?.[0];
  const teamB = event.teams?.[1];

  return (
    <Box gap={12}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        <ImgixImage enableFasterImage size={24} source={{ uri: teamA?.logo }} style={{ height: 24, width: 24, borderRadius: 8 }} />
        <Text size="17pt" weight="bold" color="label" style={{ flex: 1 }}>
          {teamA?.name}
        </Text>
        <Text size="17pt" weight="bold" color="label">
          {teamAScore}
        </Text>
      </Box>
      <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
      <Box flexDirection="row" alignItems="center" gap={10}>
        <ImgixImage size={24} source={{ uri: teamB?.logo }} style={{ height: 24, width: 24, borderRadius: 8 }} />
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

function getGameStatus(event: PolymarketEvent) {
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
