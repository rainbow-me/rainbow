import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Box, Separator, Text } from '@/design-system';
import { Game_Interruption, Game_Status, type Participant, type ScoreColumn } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { GameScore } from '@/features/sports/ui/GameScore';
import { SportsImage } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { white } from '@/worklets/colors';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';

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

const SCORE_BACKGROUND_COLOR = white(0.02);

/**
 * Displays a game's status, participants and scores.
 */
export const GameBoxScore = memo(function GameBoxScore({ gameId, isDarkMode }: { gameId: string; isDarkMode: boolean }) {
  const game = useSportsStore(s => s.games[gameId]);
  const interruptionLabelKey = game ? INTERRUPTION_LABELS[game.interruption] : undefined;
  const statusLabelKey = interruptionLabelKey ?? (game ? STATUS_LABELS[game.status] : undefined);
  const live = game?.status === Game_Status.STATUS_LIVE;

  return (
    <Box gap={12}>
      {game ? (
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
          {live && !interruptionLabelKey ? <Box width={8} height={8} background="red" borderRadius={4} /> : null}

          {statusLabelKey ? (
            <Text align="center" color={live && !interruptionLabelKey ? 'red' : 'labelTertiary'} size="15pt" weight="heavy">
              {i18n.t(statusLabelKey)}
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
        backgroundColor={SCORE_BACKGROUND_COLOR}
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
}) {
  if (!participant) return null;

  return (
    <Box flexDirection="row" alignItems="center" gap={10} style={styles.participantScoreRow}>
      <SportsImage isDarkMode={isDarkMode} imageUrl={participant.imageUrl} name={participant.name} size={24} />
      <Text color="label" size="17pt" weight="bold" numberOfLines={2} style={styles.participantText}>
        {participant.name}
      </Text>
      <GameScore score={score} participantIndex={index} />
    </Box>
  );
});

const styles = StyleSheet.create({
  participantScoreRow: { minHeight: 28 },
  participantText: { flex: 1 },
});
