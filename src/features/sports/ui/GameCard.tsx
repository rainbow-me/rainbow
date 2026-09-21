import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { deepEqual } from '@storesjs/stores';
import { LinearGradient } from 'expo-linear-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Text, useColorMode, useForegroundColor } from '@/design-system';
import { findScope } from '@/features/sports/core/browse';
import { Game_Interruption, Game_Status, Winner_Kind, type Selection } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { GameOffer } from '@/features/sports/ui/GameOffer';
import { GameScore } from '@/features/sports/ui/GameScore';
import { SportsBadge, SportsImage } from '@/features/sports/ui/SportsImage';
import { SportsSurface } from '@/features/sports/ui/SportsSurface';
import * as i18n from '@/languages';

export type SportsGamePress = (gameId: string, selection?: Selection) => void;

export const GameCard = memo(function GameCard({
  gameId,
  scopeId,
  width,
  onPress,
}: {
  gameId: string;
  scopeId?: string;
  width: number;
  onPress: SportsGamePress;
}) {
  const exists = useSportsStore(state => Boolean(state.games[gameId]));
  const threeWay = useSportsStore(state => state.games[gameId]?.winner?.kind === Winner_Kind.KIND_THREE_WAY);
  if (!exists) return null;

  return (
    <GameCardSurface width={width} threeWay={threeWay} testID={`sports-game-${gameId}`}>
      <GameHeader gameId={gameId} scopeId={scopeId} onPress={onPress} />
      <GameDivider header />
      <GameParticipant gameId={gameId} index={0} onPress={onPress} />
      <GameDivider />
      <GameParticipant gameId={gameId} index={1} onPress={onPress} />
      {threeWay && (
        <>
          <GameDivider />
          <DrawOffer gameId={gameId} onPress={onPress} />
        </>
      )}
    </GameCardSurface>
  );
});

export function GameCardSkeleton({ width }: { width: number }) {
  const backgroundColor = useForegroundColor('fillTertiary');
  return (
    <GameCardSurface width={width} testID="sports-game-skeleton">
      <View style={styles.header}>
        <View style={[styles.skeletonBadge, { backgroundColor }]} />
        <View style={[styles.skeletonLeague, { backgroundColor }]} />
        <View style={styles.skeletonSpacer} />
        <View style={[styles.skeletonTime, { backgroundColor }]} />
      </View>
      <GameDivider header />
      <SkeletonParticipant backgroundColor={backgroundColor} />
      <GameDivider />
      <SkeletonParticipant backgroundColor={backgroundColor} />
    </GameCardSurface>
  );
}

function SkeletonParticipant({ backgroundColor }: { backgroundColor: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.skeletonLogo, { backgroundColor }]} />
      <View style={styles.skeletonName}>
        <View style={[styles.skeletonSubtitle, { backgroundColor }]} />
        <View style={[styles.skeletonTitle, { backgroundColor }]} />
      </View>
      <View style={[styles.skeletonOffer, { backgroundColor }]} />
    </View>
  );
}

function GameCardSurface({
  width,
  threeWay = false,
  testID,
  children,
}: {
  width: number;
  threeWay?: boolean;
  testID: string;
  children: ReactNode;
}) {
  const { isDarkMode } = useColorMode();
  return (
    <SportsSurface
      borderRadius={24}
      color={isDarkMode ? '#000000' : undefined}
      gradient={isDarkMode ? undefined : LIGHT_CARD_FILL}
      borderColor={isDarkMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF'}
      shadows={isDarkMode ? DARK_CARD_SHADOWS : LIGHT_CARD_SHADOWS}
      innerShadow={isDarkMode ? { color: 'rgba(255,255,255,0.15)', blur: 30, dx: 0, dy: 8 } : undefined}
      style={[styles.surface, { width, height: threeWay ? 222 : 166 }]}
      testID={testID}
    >
      {children}
    </SportsSurface>
  );
}

function GameHeader({ gameId, scopeId, onPress }: { gameId: string; scopeId?: string; onPress: SportsGamePress }) {
  const { isDarkMode } = useColorMode();
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
              <SportsBadge scope={header.competition} size={28} />
              <Text color="label" size="17pt" weight="heavy" numberOfLines={1} style={styles.competitionName}>
                {header.competition.name}
              </Text>
            </>
          )}
        </View>
        <View style={styles.gameTime}>
          {status ? (
            <Text color="labelTertiary" size="13pt" weight="bold">
              {status}
            </Text>
          ) : live ? (
            <>
              {!!header.clock && (
                <Text color="labelTertiary" size="13pt" weight="bold" tabularNumbers>
                  {header.clock}
                </Text>
              )}
              {!!header.period && (
                <SportsSurface
                  borderRadius={8}
                  color={isDarkMode ? 'rgba(255,255,255,0.07)' : undefined}
                  gradient={isDarkMode ? undefined : LIGHT_BADGE_FILL}
                  borderColor={isDarkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF'}
                  borderWidth={4 / 3}
                  shadows={isDarkMode ? undefined : BADGE_SHADOWS}
                  style={styles.period}
                >
                  <Text color="labelTertiary" size="13pt" weight="bold">
                    {header.period}
                  </Text>
                </SportsSurface>
              )}
              {(header.clock || header.period) && (
                <Text color="labelTertiary" size="15pt" weight="bold" style={styles.dot}>
                  ·
                </Text>
              )}
              <Text color={{ custom: isDarkMode ? '#FF584D' : '#FA423C' }} size="13pt" weight="heavy" uppercase>
                {i18n.t(i18n.l.sports.live)}
              </Text>
            </>
          ) : header.startsAt ? (
            <Text color="labelTertiary" size="13pt" weight="bold">
              {formatStart(header.startsAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

function GameParticipant({ gameId, index, onPress }: { gameId: string; index: 0 | 1; onPress: SportsGamePress }) {
  const { participant, sportId } = useSportsStore(state => {
    const game = state.games[gameId];
    return {
      participant: game?.participants[index],
      sportId: state.catalog?.sports.find(sport => sport.competitions.some(competition => game?.competitionIds.includes(competition.id)))
        ?.id,
    };
  }, deepEqual);
  if (!participant) return null;
  const compact = sportId === 'tennis' || sportId === 'esports';
  const imageSize = sportId === 'tennis' ? 24 : sportId === 'esports' ? 32 : 36;
  const alias = participant.shortName;
  const hasPrefix = alias && participant.name.endsWith(` ${alias}`);
  const name = hasPrefix ? alias : participant.name;
  const subtitle = hasPrefix ? participant.name.slice(0, -alias.length).trim() : undefined;
  return (
    <View style={styles.row}>
      <View style={styles.participantButton}>
        <ButtonPressAnimation onPress={() => onPress(gameId)} scaleTo={0.98}>
          <View style={styles.participant}>
            <View style={[styles.logo, compact && styles.compactLogo]}>
              <SportsImage
                imageUrl={participant.imageUrl}
                name={participant.name}
                size={imageSize}
                width={sportId === 'tennis' ? 24 : compact ? 28 : 42}
              />
            </View>
            <View style={styles.name}>
              {!!subtitle && (
                <Text color="labelQuaternary" size="13pt" weight="bold" numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
              <Text color="label" size="17pt" weight="bold" numberOfLines={subtitle ? 1 : 2}>
                {name}
              </Text>
            </View>
            <GameScore gameId={gameId} participantIndex={index} />
          </View>
        </ButtonPressAnimation>
      </View>
      <ParticipantOffers gameId={gameId} index={index} glow={compact} onPress={onPress} />
    </View>
  );
}

function ParticipantOffers({ gameId, index, glow, onPress }: { gameId: string; index: 0 | 1; glow: boolean; onPress: SportsGamePress }) {
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
        <GameOffer selection={offers.winner} color={offers.color} glow={glow} onPress={select} accessibilityLabel={offers.name} />
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

function GameDivider({ header = false }: { header?: boolean }) {
  const { isDarkMode } = useColorMode();
  return (
    <View style={styles.divider}>
      {isDarkMode ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
          locations={[0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.darkDivider}
        />
      ) : !header ? (
        <View style={styles.lightDivider}>
          <LinearGradient
            colors={['rgba(0,0,0,0.03)', 'rgba(102,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dividerLine}
          />
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dividerLine}
          />
        </View>
      ) : null}
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

const LIGHT_CARD_FILL = ['rgba(255,255,255,0.68)', 'rgba(255,255,255,0.96)'] as const;
const LIGHT_BADGE_FILL = ['rgba(255,255,255,0.54)', 'rgba(255,255,255,0.81)'] as const;
const DARK_CARD_SHADOWS = [{ color: 'rgba(0,0,0,0.06)', blur: 12, dx: 0, dy: 4, drawBehind: true }];
const LIGHT_CARD_SHADOWS = [
  { color: 'rgba(0,0,0,0.06)', blur: 12, dx: 0, dy: 2, drawBehind: true },
  { color: 'rgba(0,0,0,0.02)', blur: 3, dx: 0, dy: 2 },
];
const BADGE_SHADOWS = [
  { color: 'rgba(0,0,0,0.06)', blur: 8, dx: 0, dy: 2, drawBehind: true },
  { color: 'rgba(0,0,0,0.02)', blur: 3, dx: 0, dy: 2 },
];

const styles = StyleSheet.create({
  surface: { paddingBottom: 6 },
  header: {
    height: 48,
    paddingTop: 12,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  competition: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  competitionName: { flexShrink: 1 },
  gameTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  period: { paddingHorizontal: 5, height: 19, justifyContent: 'center' },
  dot: { opacity: 0.7 },
  row: { height: 54, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 12 },
  participantButton: { flex: 1 },
  participant: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  logo: { width: 42, height: 36, alignItems: 'center', justifyContent: 'center' },
  compactLogo: { width: 32, height: 28 },
  name: { flex: 1, gap: 8 },
  offers: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unavailable: { width: 62, height: 42, alignItems: 'center', justifyContent: 'center' },
  draw: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: { height: 2, paddingLeft: 2 },
  darkDivider: { flex: 1 },
  lightDivider: { marginRight: 8 },
  dividerLine: { height: 1 },
  skeletonBadge: { width: 28, height: 28, borderRadius: 10, borderCurve: 'continuous' },
  skeletonLeague: { width: 48, height: 12, marginLeft: 2, borderRadius: 6 },
  skeletonSpacer: { flex: 1 },
  skeletonTime: { width: 64, height: 9, borderRadius: 5 },
  skeletonLogo: { width: 36, height: 36, marginHorizontal: 3, borderRadius: 8, borderCurve: 'continuous' },
  skeletonName: { flex: 1, gap: 8 },
  skeletonSubtitle: { width: 70, height: 9, borderRadius: 5 },
  skeletonTitle: { width: 90, height: 12, borderRadius: 6 },
  skeletonOffer: { width: 62, height: 42, borderRadius: 15, borderCurve: 'continuous' },
});
