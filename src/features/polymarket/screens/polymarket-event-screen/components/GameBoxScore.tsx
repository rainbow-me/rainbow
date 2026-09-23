import { memo, type ReactElement } from 'react';

import { Box, globalColors, Separator, Text } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { Game_Interruption, Game_Status, type Participant, type ScoreColumn } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { GameScore } from '@/features/sports/ui/GameScore';
import { SportsImage } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';

export const GameBoxScore = memo(function GameBoxScore({ gameId, isDarkMode }: { gameId: string; isDarkMode: boolean }): ReactElement {
  const game = useSportsStore(s => s.games[gameId]);
  const interruption = game ? INTERRUPTION_LABELS[game.interruption] : undefined;
  const label = interruption ?? (game ? STATUS_LABELS[game.status] : undefined);
  const live = game?.status === Game_Status.STATUS_LIVE;

  return (
    <Box gap={12}>
      {game ? (
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
          {live && !interruption ? <Box width={8} height={8} background="red" borderRadius={4} /> : null}
          {label ? (
            <Text align="center" color={live && !interruption ? 'red' : 'labelTertiary'} size="15pt" weight="heavy">
              {i18n.t(label)}
            </Text>
          ) : null}
          {live && game.period ? (
            <Text color="labelTertiary" size="15pt" weight="bold">
              {game.period}
            </Text>
          ) : null}
          {live && game.clock ? (
            <Text color="labelTertiary" size="15pt" weight="bold" tabularNumbers>
              {game.clock}
            </Text>
          ) : null}
          {game.status === Game_Status.STATUS_SCHEDULED && game.startsAt ? (
            <Text color="labelQuaternary" size="15pt" weight="bold">
              {formatTimestamp(toUnixTime(game.startsAt))}
            </Text>
          ) : null}
        </Box>
      ) : null}

      <Box
        gap={12}
        backgroundColor={opacity(globalColors.white100, 0.02)}
        borderRadius={24}
        borderWidth={THICKER_BORDER_WIDTH}
        borderColor="separatorSecondary"
        paddingHorizontal="16px"
        paddingVertical="12px"
      >
        <ParticipantScore isDarkMode={isDarkMode} participant={game?.participants[0]} score={game?.score} index={0} />
        <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
        <ParticipantScore isDarkMode={isDarkMode} participant={game?.participants[1]} score={game?.score} index={1} />
      </Box>
    </Box>
  );
});

const ParticipantScore = memo(function ParticipantScore({
  isDarkMode,
  participant,
  score,
  index,
}: {
  isDarkMode: boolean;
  participant?: Participant;
  score?: ScoreColumn[];
  index: 0 | 1;
}): ReactElement | null {
  if (!participant) return null;

  return (
    <Box flexDirection="row" alignItems="center" gap={10} style={{ minHeight: 28 }}>
      <SportsImage isDarkMode={isDarkMode} imageUrl={participant.imageUrl} name={participant.name} size={24} />
      <Text color="label" size="17pt" weight="bold" numberOfLines={2} style={{ flex: 1 }}>
        {participant.name}
      </Text>
      <GameScore score={score} participantIndex={index} />
    </Box>
  );
});

const STATUS_LABELS: Partial<Record<Game_Status, string>> = {
  [Game_Status.STATUS_LIVE]: i18n.l.sports.live,
  [Game_Status.STATUS_ENDED]: i18n.l.sports.final,
  [Game_Status.STATUS_CANCELLED]: i18n.l.sports.cancelled,
  [Game_Status.STATUS_POSTPONED]: i18n.l.sports.postponed,
};

const INTERRUPTION_LABELS: Partial<Record<Game_Interruption, string>> = {
  [Game_Interruption.INTERRUPTION_DELAYED]: i18n.l.sports.delayed,
  [Game_Interruption.INTERRUPTION_SUSPENDED]: i18n.l.sports.suspended,
};
