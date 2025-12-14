import React, { memo } from 'react';
import { ImgixImage } from '@/components/images';
import { Box, Separator, Text, TextShadow } from '@/design-system';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

export const GameBoxScore = memo(function GameBoxScore({ event }: { event: PolymarketEvent | null }) {
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
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={10}>
        <TextShadow blur={14} shadowOpacity={0.5}>
          <Text align="center" size="15pt" style={{ letterSpacing: 0.8 }} weight="heavy" color={{ custom: '#E75C29' }}>
            {'LIVE'}
          </Text>
        </TextShadow>
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
  let periodTitle = `${currentPeriod} ${elapsed ? `· ${elapsed}` : ''}`;

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
