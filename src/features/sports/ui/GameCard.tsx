import { memo, useMemo, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Canvas, Path, Shadow } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { globalColors } from '@/design-system';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { getSquirclePath } from '@/design-system/layout/shapes';
import { Game_Interruption, Game_Status, Winner_Kind, type Selection } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { GameOffer } from '@/features/sports/ui/GameOffer';
import { GameScore } from '@/features/sports/ui/GameScore';
import { SportsBadge, SportsImage } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { black, white } from '@/worklets/colors';

// ============ Types ========================================================== //

export type SportsGamePress = (gameId: string, offer?: { selection: Selection; outcomeColor: string }) => void;

type ParticipantProps = { gameId: string; index: 0 | 1; onPress: SportsGamePress };

// ============ Constants ====================================================== //

const STATUS_LABELS: Partial<
  Record<Game_Status | Game_Interruption.INTERRUPTION_DELAYED | Game_Interruption.INTERRUPTION_SUSPENDED, string>
> = {
  [Game_Interruption.INTERRUPTION_DELAYED]: i18n.l.sports.delayed,
  [Game_Interruption.INTERRUPTION_SUSPENDED]: i18n.l.sports.suspended,
  [Game_Status.STATUS_ENDED]: i18n.l.sports.final,
  [Game_Status.STATUS_CANCELLED]: i18n.l.sports.cancelled,
  [Game_Status.STATUS_POSTPONED]: i18n.l.sports.postponed,
};

const LIGHT_CARD_FILL = [white(0.68), white(0.96)] as const;
const LIGHT_BADGE_FILL = [white(0.54), white(0.81)] as const;

// ============ GameCard ======================================================= //

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
}): ReactElement | null {
  const rowCount = useSportsStore(s => {
    const game = s.games[gameId];
    if (!game) return 0;
    return game.winner?.kind === Winner_Kind.KIND_THREE_WAY ? 3 : 2;
  });

  if (!rowCount) return null;

  return (
    <ButtonPressAnimation onPress={() => onPress(gameId)} scaleTo={0.98}>
      <GameCardSurface width={width} threeWay={rowCount === 3} testID={`sports-game-${gameId}`}>
        <GameHeader gameId={gameId} scopeId={scopeId} />
        <GameDivider header />

        <GameParticipant gameId={gameId} index={0} onPress={onPress} />
        <GameDivider />

        <GameParticipant gameId={gameId} index={1} onPress={onPress} />
        {rowCount === 3 ? (
          <>
            <GameDivider />
            <GameDrawRow gameId={gameId} onPress={onPress} />
          </>
        ) : null}
      </GameCardSurface>
    </ButtonPressAnimation>
  );
});

// ============ Base Card Components =========================================== //

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
  const rows = threeWay ? 3 : 2;
  const height = styles.header.height + rows * (styles.row.height + styles.divider.height) + styles.surface.paddingBottom;

  return (
    <View style={[styles.cardShadow, { shadowOffset: { width: 0, height: isDarkMode ? 4 : 2 } }]} testID={testID}>
      <View
        style={[
          styles.surface,
          { width, height, backgroundColor: isDarkMode ? globalColors.grey100 : undefined },
          isDarkMode ? undefined : styles.tightShadow,
        ]}
      >
        <View pointerEvents="none" style={styles.cardBackground}>
          {isDarkMode ? (
            <CardInnerShadow width={width} height={height} />
          ) : (
            <LinearGradient colors={LIGHT_CARD_FILL} style={StyleSheet.absoluteFill} />
          )}
        </View>
        {children}
        <Border borderRadius={24} borderWidth={2} borderColor={{ custom: white(isDarkMode ? 0.03 : 1) }} enableInLightMode />
      </View>
    </View>
  );
}

const CardInnerShadow = memo(function CardInnerShadow({ width, height }: { width: number; height: number }) {
  const path = useMemo(() => getSquirclePath({ width, height, borderRadius: 24 }), [height, width]);
  return (
    <Canvas style={{ width, height }}>
      <Path path={path}>
        <Shadow color={white(0.15)} blur={30} dx={0} dy={8} inner shadowOnly />
      </Path>
    </Canvas>
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

const GameDivider = memo(function GameDivider({ header = false }: { header?: boolean }) {
  const { isDarkMode } = useColorMode();
  return (
    <View style={styles.divider}>
      {isDarkMode ? (
        <LinearGradient
          colors={[white(0.04), white(0)]}
          locations={[0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.darkDivider}
        />
      ) : header ? null : (
        <View style={styles.lightDivider}>
          <LinearGradient colors={[black(0.03), black(0)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dividerLine} />
          <LinearGradient
            colors={[globalColors.white100, white(0)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dividerLine}
          />
        </View>
      )}
    </View>
  );
});

// ============ Game Header ==================================================== //

const GameHeader = memo(function GameHeader({ gameId, scopeId }: { gameId: string; scopeId?: string }): ReactElement {
  return (
    <View style={styles.header}>
      <GameCompetition gameId={gameId} scopeId={scopeId} />
      <GameTime gameId={gameId} />
    </View>
  );
});

function GameCompetition({ gameId, scopeId }: { gameId: string; scopeId?: string }): ReactElement {
  const competition = useSportsStore(s => {
    const ids = s.games[gameId]?.competitionIds;
    const id = scopeId && ids?.includes(scopeId) ? scopeId : ids?.[0];
    return id ? s.catalog?.scopes[id] : undefined;
  });

  return (
    <View style={styles.competition}>
      {competition ? (
        <>
          <SportsBadge scope={competition} size={28} />
          <Text color="label" size="17pt" weight="heavy" numberOfLines={1} style={styles.competitionName}>
            {competition.name}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const GameTime = memo(function GameTime({ gameId }: { gameId: string }): ReactElement {
  const status = useSportsStore(s => {
    const game = s.games[gameId];
    if (!game) return undefined;

    return game.interruption === Game_Interruption.INTERRUPTION_DELAYED || game.interruption === Game_Interruption.INTERRUPTION_SUSPENDED
      ? game.interruption
      : game.status;
  });

  const label = status ? STATUS_LABELS[status] : undefined;

  return (
    <View style={styles.gameTime}>
      {label ? (
        <Text color="labelTertiary" size="13pt" weight="bold">
          {i18n.t(label)}
        </Text>
      ) : status === Game_Status.STATUS_LIVE ? (
        <GameLiveTime gameId={gameId} />
      ) : (
        <GameStartTime gameId={gameId} />
      )}
    </View>
  );
});

function GameLiveTime({ gameId }: { gameId: string }): ReactElement {
  const clock = useSportsStore(s => s.games[gameId]?.clock);
  const period = useSportsStore(s => s.games[gameId]?.period);

  return (
    <>
      {clock ? (
        <Text color="labelTertiary" size="13pt" weight="bold" tabularNumbers>
          {clock}
        </Text>
      ) : null}

      {period ? <GamePeriod period={period} /> : null}

      {clock || period ? (
        <Text color="labelTertiary" size="15pt" weight="bold" style={styles.dot}>
          ·
        </Text>
      ) : null}

      <Text color="red" size="13pt" weight="heavy" uppercase>
        {i18n.t(i18n.l.sports.live)}
      </Text>
    </>
  );
}

const GamePeriod = memo(function GamePeriod({ period }: { period: string }): ReactElement {
  const { isDarkMode } = useColorMode();

  return (
    <View style={isDarkMode ? undefined : styles.periodShadow}>
      <View style={[styles.period, isDarkMode ? styles.darkPeriod : styles.tightShadow]}>
        {isDarkMode ? null : (
          <View pointerEvents="none" style={styles.periodBackground}>
            <LinearGradient colors={LIGHT_BADGE_FILL} style={StyleSheet.absoluteFill} />
          </View>
        )}

        <Text color="labelTertiary" size="13pt" weight="bold">
          {period}
        </Text>
        <Border
          borderRadius={8}
          borderWidth={THICK_BORDER_WIDTH}
          borderColor={{ custom: white(isDarkMode ? 0.06 : 1) }}
          enableInLightMode
        />
      </View>
    </View>
  );
});

function GameStartTime({ gameId }: { gameId: string }): ReactElement | null {
  const startsAt = useSportsStore(s => s.games[gameId]?.startsAt);
  if (!startsAt) return null;

  return (
    <Text color="labelTertiary" size="13pt" weight="bold">
      {formatStart(startsAt)}
    </Text>
  );
}

// ============ Game Rows ====================================================== //

const GameParticipant = memo(function GameParticipant({ gameId, index, onPress }: ParticipantProps): ReactElement | null {
  const participant = useSportsStore(s => s.games[gameId]?.participants[index]);

  const sportId = useSportsStore(s => {
    const competitionId = s.games[gameId]?.competitionIds[0];
    return competitionId ? s.catalog?.scopes[competitionId]?.parentId : undefined;
  });

  if (!participant) return null;

  return (
    <View style={styles.row}>
      <View style={styles.participant}>
        <ParticipantIdentity name={participant.name} shortName={participant.shortName} imageUrl={participant.imageUrl} sportId={sportId} />
        <GameScore gameId={gameId} participantIndex={index} />
      </View>

      <View style={styles.offers}>
        <ParticipantSpreadOffer gameId={gameId} index={index} color={participant.color} onPress={onPress} />
        <ParticipantWinnerOffer
          gameId={gameId}
          selection={participant.winner}
          color={participant.color}
          glow={sportId === 'tennis' || sportId === 'esports'}
          onPress={onPress}
        />
      </View>
    </View>
  );
});

const ParticipantIdentity = memo(function ParticipantIdentity({
  name,
  shortName,
  imageUrl,
  sportId,
}: {
  name: string;
  shortName?: string;
  imageUrl?: string;
  sportId?: string;
}): ReactElement {
  const compact = sportId === 'tennis' || sportId === 'esports';
  const imageSize = sportId === 'tennis' ? 24 : sportId === 'esports' ? 32 : 36;
  const hasPrefix = shortName && name.endsWith(` ${shortName}`);
  const subtitle = hasPrefix ? name.slice(0, -shortName.length).trim() : undefined;

  return (
    <>
      <View style={[styles.logo, compact ? styles.compactLogo : undefined]}>
        <SportsImage imageUrl={imageUrl} name={name} size={imageSize} width={sportId === 'tennis' ? 24 : compact ? 28 : 42} />
      </View>

      <View style={styles.name}>
        {subtitle ? (
          <Text color="labelTertiary" size="13pt" weight="bold" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        <Text color="label" size="17pt" weight="bold" numberOfLines={subtitle ? 1 : 2}>
          {hasPrefix ? shortName : name}
        </Text>
      </View>
    </>
  );
});

const ParticipantSpreadOffer = memo(function ParticipantSpreadOffer({
  gameId,
  index,
  color,
  onPress,
}: ParticipantProps & { color?: string }): ReactElement | null {
  const spread = useSportsStore(s => s.games[gameId]?.spread);
  const outcome = spread?.outcomes[index];

  if (!spread || !outcome) return null;

  return (
    <GameOffer
      tokenId={outcome.tokenId}
      color={color}
      line={outcome.line}
      onPress={outcomeColor =>
        onPress(gameId, {
          selection: {
            eventId: spread.eventId,
            marketId: spread.marketId,
            tokenId: outcome.tokenId,
            outcomeIndex: outcome.outcomeIndex,
          },
          outcomeColor,
        })
      }
    />
  );
});

const ParticipantWinnerOffer = memo(function ParticipantWinnerOffer({
  gameId,
  selection,
  color,
  glow,
  onPress,
}: {
  gameId: string;
  selection?: Selection;
  color?: string;
  glow: boolean;
  onPress: SportsGamePress;
}): ReactElement {
  return selection ? (
    <GameOffer
      tokenId={selection.tokenId}
      color={color}
      glow={glow}
      onPress={outcomeColor => onPress(gameId, { selection, outcomeColor })}
    />
  ) : (
    <View style={styles.unavailable}>
      <Text color="labelQuaternary" size="17pt" weight="heavy">
        —
      </Text>
    </View>
  );
});

const GameDrawRow = memo(function GameDrawRow({ gameId, onPress }: { gameId: string; onPress: SportsGamePress }): ReactElement {
  return (
    <View style={[styles.row, styles.draw]}>
      <Text color="labelSecondary" size="15pt" weight="bold">
        {i18n.t(i18n.l.sports.draw)}
      </Text>
      <DrawOffer gameId={gameId} onPress={onPress} />
    </View>
  );
});

function DrawOffer({ gameId, onPress }: { gameId: string; onPress: SportsGamePress }): ReactElement | null {
  const selection = useSportsStore(s => s.games[gameId]?.winner?.draw);
  if (!selection) return null;

  return <GameOffer tokenId={selection.tokenId} onPress={outcomeColor => onPress(gameId, { selection, outcomeColor })} />;
}

// ============ Utilities ====================================================== //

function formatStart(value: string): string {
  const date = new Date(value);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  surface: {
    paddingBottom: 6,
    borderRadius: 24,
    borderCurve: 'continuous',
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  cardShadow: {
    borderRadius: 24,
    borderCurve: 'continuous',
    shadowColor: globalColors.grey100,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  tightShadow: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
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
  competition: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  competitionName: { flexShrink: 1 },
  gameTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  period: {
    paddingHorizontal: 5,
    height: 19,
    justifyContent: 'center',
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  periodBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  darkPeriod: { backgroundColor: white(0.07) },
  periodShadow: {
    borderRadius: 8,
    borderCurve: 'continuous',
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  dot: { opacity: 0.7 },
  row: {
    height: 52,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participant: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 36,
  },
  logo: {
    width: 42,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLogo: { width: 32, height: 28 },
  name: { flex: 1, gap: 8 },
  offers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unavailable: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draw: { justifyContent: 'space-between' },
  divider: { height: 2, paddingLeft: 2 },
  darkDivider: { flex: 1 },
  lightDivider: { marginRight: 8 },
  dividerLine: { height: 1 },
  skeletonBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  skeletonLeague: {
    width: 48,
    height: 12,
    marginLeft: 2,
    borderRadius: 6,
  },
  skeletonSpacer: { flex: 1 },
  skeletonTime: {
    width: 64,
    height: 9,
    borderRadius: 5,
  },
  skeletonLogo: {
    width: 36,
    height: 36,
    marginHorizontal: 3,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  skeletonName: { flex: 1, gap: 8 },
  skeletonSubtitle: {
    width: 70,
    height: 9,
    borderRadius: 5,
  },
  skeletonTitle: {
    width: 90,
    height: 12,
    borderRadius: 6,
  },
  skeletonOffer: {
    width: 60,
    height: 40,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
});
