import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { deepEqual } from '@storesjs/stores';
import { LinearGradient } from 'expo-linear-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Text, useColorMode } from '@/design-system';
import { findScope } from '@/features/sports/core/browse';
import { Game_Interruption, Game_Status, Winner_Kind, type Selection } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { GameOffer } from '@/features/sports/ui/GameOffer';
import { GameScore } from '@/features/sports/ui/GameScore';
import { SportsImage } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';

export type SportsGamePress = (gameId: string, selection?: Selection) => void;

export const GameCard = memo(function GameCard({
  gameId,
  scopeId,
  onPress,
}: {
  gameId: string;
  scopeId?: string;
  onPress: SportsGamePress;
}) {
  const { isDarkMode } = useColorMode();
  const exists = useSportsStore(state => Boolean(state.games[gameId]));
  const threeWay = useSportsStore(state => state.games[gameId]?.winner?.kind === Winner_Kind.KIND_THREE_WAY);
  if (!exists) return null;

  return (
    <View style={[styles.card, isDarkMode ? styles.darkCard : styles.lightCard]} testID={`sports-game-${gameId}`}>
      <LinearGradient
        colors={isDarkMode ? ['rgba(255,255,255,0.085)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.68)', 'rgba(255,255,255,0.96)']}
        style={styles.surface}
      >
        <GameHeader gameId={gameId} scopeId={scopeId} onPress={onPress} />
        <GameParticipant gameId={gameId} index={0} onPress={onPress} />
        <GameParticipant gameId={gameId} index={1} onPress={onPress} />
        {threeWay && <DrawOffer gameId={gameId} onPress={onPress} />}
      </LinearGradient>
    </View>
  );
});

function GameHeader({ gameId, scopeId, onPress }: { gameId: string; scopeId?: string; onPress: SportsGamePress }) {
  const header = useSportsStore(state => {
    const game = state.games[gameId];
    if (!game) return undefined;
    const id = scopeId && game.competitionIds.includes(scopeId) ? scopeId : game.competitionIds[0];
    return {
      competition: id ? findScope(state.catalog, id) : undefined,
      status: game.status,
      interruption: game.interruption,
      period: game.period,
      clock: game.clock,
      startsAt: game.startsAt,
    };
  }, deepEqual);
  if (!header) return null;

  const live = header.status === Game_Status.STATUS_LIVE;
  const label = INTERRUPTION_LABELS[header.interruption] ?? STATUS_LABELS[header.status];
  const status = label ? i18n.t(label) : undefined;

  return (
    <ButtonPressAnimation onPress={() => onPress(gameId)} scaleTo={0.98}>
      <View style={styles.header}>
        <View style={styles.competition}>
          {header.competition && (
            <>
              <SportsImage imageUrl={header.competition.imageUrl} name={header.competition.name} size={28} />
              <Text color="label" size="17pt" weight="heavy" numberOfLines={1} style={styles.competitionName}>
                {header.competition.name}
              </Text>
            </>
          )}
        </View>
        <View style={styles.gameTime}>
          {status ? (
            <Text color="labelSecondary" size="13pt" weight="bold">
              {status}
            </Text>
          ) : live ? (
            <>
              {!!header.clock && (
                <Text color="labelSecondary" size="13pt" weight="bold" tabularNumbers>
                  {header.clock}
                </Text>
              )}
              {!!header.period && (
                <View style={styles.period}>
                  <Text color="labelSecondary" size="13pt" weight="bold">
                    {header.period}
                  </Text>
                </View>
              )}
              <Text color="red" size="13pt" weight="heavy" uppercase>
                {i18n.t(i18n.l.sports.live)}
              </Text>
            </>
          ) : header.startsAt ? (
            <Text color="labelSecondary" size="13pt" weight="bold">
              {formatStart(header.startsAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

function GameParticipant({ gameId, index, onPress }: { gameId: string; index: 0 | 1; onPress: SportsGamePress }) {
  const participant = useSportsStore(state => state.games[gameId]?.participants[index], deepEqual);
  if (!participant) return null;
  const alias = participant.shortName;
  const hasPrefix = alias && participant.name.endsWith(` ${alias}`);
  const name = hasPrefix ? alias : participant.name;
  const subtitle = hasPrefix ? participant.name.slice(0, -alias.length).trim() : undefined;
  return (
    <View style={styles.row}>
      <View style={styles.participantButton}>
        <ButtonPressAnimation onPress={() => onPress(gameId)} scaleTo={0.98}>
          <View style={styles.participant}>
            <View style={styles.logo}>
              <SportsImage imageUrl={participant.imageUrl} name={participant.name} size={36} />
            </View>
            <View style={styles.name}>
              {!!subtitle && (
                <Text color="labelQuaternary" size="13pt" weight="bold" numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
              <Text color="label" size="17pt" weight="bold" numberOfLines={2}>
                {name}
              </Text>
            </View>
            <GameScore gameId={gameId} participantIndex={index} />
          </View>
        </ButtonPressAnimation>
      </View>
      <ParticipantOffers gameId={gameId} index={index} onPress={onPress} />
    </View>
  );
}

function ParticipantOffers({ gameId, index, onPress }: { gameId: string; index: 0 | 1; onPress: SportsGamePress }) {
  const offers = useSportsStore(state => {
    const game = state.games[gameId];
    const participant = game?.participants[index];
    const spread = game?.spread;
    const outcome = spread?.outcomes[index];
    return {
      winner: participant?.winner,
      color: participant?.color,
      name: participant?.name ?? '',
      spread:
        spread && outcome
          ? { eventId: spread.eventId, marketId: spread.marketId, tokenId: outcome.tokenId, outcomeIndex: outcome.outcomeIndex }
          : undefined,
      line: outcome?.line,
    };
  }, deepEqual);
  const select = (selection: Selection) => onPress(gameId, selection);
  return (
    <View style={styles.offers}>
      {offers.spread && (
        <GameOffer
          selection={offers.spread}
          color={offers.color}
          line={offers.line}
          onPress={select}
          accessibilityLabel={`${offers.name}, ${offers.line && offers.line > 0 ? '+' : ''}${offers.line}`}
        />
      )}
      {offers.winner ? (
        <GameOffer selection={offers.winner} color={offers.color} onPress={select} accessibilityLabel={offers.name} />
      ) : (
        <View style={styles.unavailable}>
          <Text color="labelQuaternary" size="17pt" weight="heavy">
            —
          </Text>
        </View>
      )}
    </View>
  );
}

function DrawOffer({ gameId, onPress }: { gameId: string; onPress: SportsGamePress }) {
  const selection = useSportsStore(state => state.games[gameId]?.winner?.draw, deepEqual);
  return (
    <View style={styles.draw}>
      <Text color="labelSecondary" size="15pt" weight="bold">
        {i18n.t(i18n.l.sports.draw)}
      </Text>
      {selection && (
        <GameOffer
          selection={selection}
          onPress={selection => onPress(gameId, selection)}
          accessibilityLabel={i18n.t(i18n.l.sports.draw)}
        />
      )}
    </View>
  );
}

function formatStart(value: string): string {
  const date = new Date(value);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
}

const STATUS_LABELS: Partial<Record<Game_Status, string>> = {
  [Game_Status.STATUS_ENDED]: i18n.l.sports.final,
  [Game_Status.STATUS_CANCELLED]: i18n.l.sports.cancelled,
  [Game_Status.STATUS_POSTPONED]: i18n.l.sports.postponed,
};

const INTERRUPTION_LABELS: Partial<Record<Game_Interruption, string>> = {
  [Game_Interruption.INTERRUPTION_DELAYED]: i18n.l.sports.delayed,
  [Game_Interruption.INTERRUPTION_SUSPENDED]: i18n.l.sports.suspended,
};

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderCurve: 'continuous' },
  darkCard: {
    backgroundColor: '#080808',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    shadowOpacity: 0.06,
  },
  lightCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  surface: { borderRadius: 22, borderCurve: 'continuous', overflow: 'hidden', paddingBottom: 4 },
  header: { height: 46, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  competition: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  competitionName: { flexShrink: 1 },
  gameTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  period: { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 4, backgroundColor: 'rgba(128,128,128,0.08)' },
  row: {
    minHeight: 54,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 2,
    borderTopColor: 'rgba(128,128,128,0.045)',
  },
  participantButton: { flex: 1 },
  participant: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  logo: { width: 42, alignItems: 'center' },
  name: { flex: 1, gap: 6 },
  offers: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unavailable: { width: 62, height: 42, alignItems: 'center', justifyContent: 'center' },
  draw: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: 'rgba(128,128,128,0.045)',
  },
});
