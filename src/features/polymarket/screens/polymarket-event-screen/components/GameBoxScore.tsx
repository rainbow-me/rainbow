import { memo } from 'react';

import { deepEqual } from '@storesjs/stores';

import { Box, globalColors, Separator, Text } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { Game_Interruption, Game_Status } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { GameScore } from '@/features/sports/ui/GameScore';
import { SportsImage } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { formatTimestamp, toUnixTime } from '@/worklets/dates';

export const GameBoxScore = memo(function GameBoxScore({ gameId }: { gameId: string }) {
  return (
    <Box gap={12}>
      <GameStatus gameId={gameId} />
      <Box
        gap={12}
        backgroundColor={opacity(globalColors.white100, 0.02)}
        borderRadius={24}
        borderWidth={THICKER_BORDER_WIDTH}
        borderColor="separatorSecondary"
        paddingHorizontal="16px"
        paddingVertical="12px"
      >
        <ParticipantScore gameId={gameId} index={0} />
        <Separator color="separatorSecondary" direction="horizontal" thickness={1} />
        <ParticipantScore gameId={gameId} index={1} />
      </Box>
    </Box>
  );
});

function GameStatus({ gameId }: { gameId: string }) {
  const display = useSportsStore(state => {
    const game = state.games[gameId];
    return game
      ? { status: game.status, interruption: game.interruption, period: game.period, clock: game.clock, startsAt: game.startsAt }
      : undefined;
  }, deepEqual);
  if (!display) return null;

  const interruption = INTERRUPTION_LABELS[display.interruption];
  const label = interruption ?? STATUS_LABELS[display.status];
  const live = display.status === Game_Status.STATUS_LIVE;

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
      {live && !interruption && <Box width={8} height={8} background="red" borderRadius={4} />}
      {label && (
        <Text align="center" color={live && !interruption ? 'red' : 'labelTertiary'} size="15pt" weight="heavy">
          {i18n.t(label)}
        </Text>
      )}
      {live && display.period && (
        <Text color="labelTertiary" size="15pt" weight="bold">
          {display.period}
        </Text>
      )}
      {live && display.clock && (
        <Text color="labelTertiary" size="15pt" weight="bold" tabularNumbers>
          {display.clock}
        </Text>
      )}
      {display.status === Game_Status.STATUS_SCHEDULED && display.startsAt && (
        <Text color="labelQuaternary" size="15pt" weight="bold">
          {formatTimestamp(toUnixTime(display.startsAt))}
        </Text>
      )}
    </Box>
  );
}

function ParticipantScore({ gameId, index }: { gameId: string; index: 0 | 1 }) {
  const participant = useSportsStore(state => {
    const value = state.games[gameId]?.participants[index];
    return value ? { name: value.name, imageUrl: value.imageUrl } : undefined;
  }, deepEqual);
  if (!participant) return null;

  return (
    <Box flexDirection="row" alignItems="center" gap={10} style={{ minHeight: 28 }}>
      <SportsImage imageUrl={participant.imageUrl} name={participant.name} size={24} />
      <Text color="label" size="17pt" weight="bold" numberOfLines={2} style={{ flex: 1 }}>
        {participant.name}
      </Text>
      <GameScore gameId={gameId} participantIndex={index} />
    </Box>
  );
}

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
