import { createContext, Fragment, memo, useContext, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Canvas, Path, Shadow } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { foregroundColors, globalColors } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { getSquirclePath } from '@/design-system/layout/shapes';
import { BetButton } from '@/features/polymarket/components/BetButton';
import { type SportsCatalog, type SportsScope } from '@/features/sports/core/catalog';
import {
  Game_Interruption,
  Game_Status,
  Winner_Kind,
  type Game,
  type Participant,
  type Selection,
  type Spread,
} from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { badgeShadows } from '@/features/sports/ui/badgeShadows';
import { SPORTS_BACKGROUND_COLOR_LIGHT } from '@/features/sports/ui/colors';
import { GameScore } from '@/features/sports/ui/GameScore';
import { SportsBadge, SportsImage } from '@/features/sports/ui/SportsImage';
import { SurfaceShadow } from '@/framework/ui/components/SurfaceShadow';
import * as i18n from '@/languages';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { black, white } from '@/worklets/colors';

// ============ Types ========================================================== //

/**
 * Callback provided to game card and bet badge press handlers.
 */
export type SportsGamePress = (gameId: string, offer?: { selection: Selection; outcomeColor: string }) => void;

// ============ Constants ====================================================== //

const CARD_BORDER_RADIUS = 24;
const PARTICIPANT_INDICES: readonly (0 | 1)[] = [0, 1];

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

/**
 * Shared cache of game card shadow paths.
 */
export const GameCardPathsContext = createContext<Map<string, string> | undefined>(undefined);

/**
 * Displays a game's participants, score and available bets.
 */
export const GameCard = memo(function GameCard({
  gameId,
  scopeId,
  catalog,
  currentDay,
  isDarkMode,
  width,
  onPress,
  style,
}: {
  gameId: string;
  scopeId?: string;
  catalog?: SportsCatalog;
  currentDay: string;
  isDarkMode: boolean;
  width: number;
  onPress: SportsGamePress;
  style?: ViewStyle;
}): ReactElement | null {
  const game = useSportsStore(s => s.games[gameId]);

  if (!game) return null;

  const competitionId = scopeId && game.competitionIds.includes(scopeId) ? scopeId : game.competitionIds[0];
  const competition = catalog?.scopes[competitionId];
  const sportId = catalog?.scopes[game.competitionIds[0]]?.parentId;
  const threeWay = game.winner?.kind === Winner_Kind.KIND_THREE_WAY;

  return (
    <ButtonPressAnimation onPress={() => onPress(gameId)} scaleTo={0.98} style={style}>
      <GameCardSurface isDarkMode={isDarkMode} width={width} threeWay={threeWay} testID={`sports-game-${gameId}`}>
        <View style={styles.header}>
          <GameCompetition competition={competition} isDarkMode={isDarkMode} />
          <GameTime
            currentDay={currentDay}
            isDarkMode={isDarkMode}
            status={game.status}
            interruption={game.interruption}
            clock={game.clock}
            period={game.period}
            startsAt={game.startsAt}
          />
        </View>
        {PARTICIPANT_INDICES.map(index => {
          const participant = game.participants[index];

          return (
            <Fragment key={index}>
              <GameDivider isDarkMode={isDarkMode} header={index === 0} />
              {participant ? (
                <View style={styles.row}>
                  <View style={styles.participant}>
                    <GameRowIdentity identity={participant} sportId={sportId} isDarkMode={isDarkMode} />
                    <GameScore score={game.score} participantIndex={index} />
                  </View>

                  <ParticipantBetButtons
                    gameId={gameId}
                    participantIndex={index}
                    spread={game.spread}
                    winner={participant.winner}
                    color={participant.color}
                    isDarkMode={isDarkMode}
                    onPress={onPress}
                  />
                </View>
              ) : null}
            </Fragment>
          );
        })}
        {threeWay ? (
          <>
            <GameDivider isDarkMode={isDarkMode} />
            <GameDrawRow isDarkMode={isDarkMode} gameId={gameId} sportId={sportId} selection={game.winner?.draw} onPress={onPress} />
          </>
        ) : null}
      </GameCardSurface>
    </ButtonPressAnimation>
  );
});

// ============ Base Card Components =========================================== //

function GameCardSurface({
  isDarkMode,
  width,
  threeWay = false,
  testID,
  children,
}: {
  isDarkMode: boolean;
  width: number;
  threeWay?: boolean;
  testID: string;
  children: ReactNode;
}): ReactElement {
  const rows = threeWay ? 3 : 2;
  const height = styles.header.height + rows * (styles.row.height + styles.divider.height) + styles.surface.paddingBottom;

  const backgroundColor = isDarkMode ? globalColors.grey100 : undefined;
  const backdropColor = backgroundColor ?? SPORTS_BACKGROUND_COLOR_LIGHT;

  return (
    <View style={[styles.surface, { width, height, backgroundColor }]} testID={testID}>
      <SurfaceShadow
        backdropColor={backdropColor}
        borderRadius={CARD_BORDER_RADIUS}
        color={globalColors.grey100}
        opacity={0.06}
        radius={12}
        y={isDarkMode ? 4 : 2}
      />
      {isDarkMode ? null : (
        <SurfaceShadow
          backdropColor={backdropColor}
          borderRadius={CARD_BORDER_RADIUS}
          color={globalColors.grey100}
          opacity={0.02}
          radius={3}
          y={2}
        />
      )}
      <View pointerEvents="none" style={styles.cardBackground}>
        {isDarkMode ? (
          <CardInnerShadow width={width} height={height} />
        ) : (
          <LinearGradient colors={LIGHT_CARD_FILL} style={StyleSheet.absoluteFill} />
        )}
      </View>
      {children}
      <Border borderRadius={CARD_BORDER_RADIUS} borderWidth={2} borderColor={{ custom: white(isDarkMode ? 0.03 : 1) }} enableInLightMode />
    </View>
  );
}

const CardInnerShadow = memo(function CardInnerShadow({ width, height }: { width: number; height: number }): ReactElement {
  const paths = useContext(GameCardPathsContext);
  const key = `${width}:${height}`;
  let path = paths?.get(key);

  if (path === undefined) {
    path = getSquirclePath({ width, height, borderRadius: CARD_BORDER_RADIUS });
    paths?.set(key, path);
  }

  return (
    <Canvas style={{ width, height }}>
      <Path path={path}>
        <Shadow color={white(0.15)} blur={30} dx={0} dy={8} inner shadowOnly />
      </Path>
    </Canvas>
  );
});

/**
 * A loading placeholder for a game card.
 */
export function GameCardSkeleton({ width, isDarkMode }: { width: number; isDarkMode: boolean }): ReactElement {
  const backgroundColor = foregroundColors.fillTertiary[isDarkMode ? 'dark' : 'light'];
  return (
    <GameCardSurface isDarkMode={isDarkMode} width={width} testID="sports-game-skeleton">
      <View style={styles.header}>
        <View style={[styles.skeletonBadge, { backgroundColor }]} />
        <View style={[styles.skeletonLeague, { backgroundColor }]} />
        <View style={styles.skeletonSpacer} />
        <View style={[styles.skeletonTime, { backgroundColor }]} />
      </View>
      <GameDivider isDarkMode={isDarkMode} header />
      <SkeletonParticipant backgroundColor={backgroundColor} />
      <GameDivider isDarkMode={isDarkMode} />
      <SkeletonParticipant backgroundColor={backgroundColor} />
    </GameCardSurface>
  );
}

function SkeletonParticipant({ backgroundColor }: { backgroundColor: string }): ReactElement {
  return (
    <View style={styles.row}>
      <View style={[styles.skeletonLogo, { backgroundColor }]} />
      <View style={styles.skeletonName}>
        <View style={[styles.skeletonSubtitle, { backgroundColor }]} />
        <View style={[styles.skeletonTitle, { backgroundColor }]} />
      </View>
      <View style={[styles.skeletonBetButton, { backgroundColor }]} />
    </View>
  );
}

const GameDivider = memo(function GameDivider({ header = false, isDarkMode }: { header?: boolean; isDarkMode: boolean }): ReactElement {
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

const GameCompetition = memo(function GameCompetition({
  competition,
  isDarkMode,
}: {
  competition?: SportsScope;
  isDarkMode: boolean;
}): ReactElement {
  return (
    <View style={styles.competition}>
      {competition ? (
        <>
          <SportsBadge isDarkMode={isDarkMode} scope={competition} size={28} />
          <Text color="label" size="17pt" weight="heavy" numberOfLines={1} style={styles.competitionName}>
            {competition.name}
          </Text>
        </>
      ) : null}
    </View>
  );
});

const GameTime = memo(function GameTime({
  currentDay,
  isDarkMode,
  status,
  interruption,
  clock,
  period,
  startsAt,
}: Pick<Game, 'status' | 'interruption' | 'clock' | 'period' | 'startsAt'> & { currentDay: string; isDarkMode: boolean }): ReactElement {
  const label =
    STATUS_LABELS[
      interruption === Game_Interruption.INTERRUPTION_DELAYED || interruption === Game_Interruption.INTERRUPTION_SUSPENDED
        ? interruption
        : status
    ];

  return (
    <View style={styles.gameTime}>
      {label ? (
        <Text align="center" color="labelTertiary" size="13pt" weight="bold">
          {i18n.t(label)}
        </Text>
      ) : status === Game_Status.STATUS_LIVE ? (
        <>
          {clock ? (
            <Text align="center" color="labelTertiary" size="13pt" weight="bold">
              {clock}
            </Text>
          ) : null}

          {period ? <GamePeriod isDarkMode={isDarkMode} period={period} /> : null}

          {clock || period ? (
            <Text align="center" color="labelTertiary" size="15pt" weight="bold" style={styles.dot}>
              ·
            </Text>
          ) : null}

          <Text align="center" color="red" size="13pt" weight="heavy" uppercase>
            {i18n.t(i18n.l.sports.live)}
          </Text>
        </>
      ) : startsAt ? (
        <Text align="center" color="labelTertiary" size="13pt" weight="bold">
          {formatStartTime(startsAt, currentDay)}
        </Text>
      ) : null}
    </View>
  );
});

const GamePeriod = memo(function GamePeriod({ period, isDarkMode }: { period: string; isDarkMode: boolean }): ReactElement {
  return (
    <View style={[styles.period, isDarkMode ? styles.darkPeriod : styles.lightPeriod]}>
      {isDarkMode ? null : (
        <>
          <SurfaceShadow
            backdropColor={globalColors.white100}
            borderRadius={8}
            color={globalColors.grey100}
            opacity={0.06}
            radius={8}
            y={2}
          />
          <SurfaceShadow
            backdropColor={globalColors.white100}
            borderRadius={8}
            color={globalColors.grey100}
            opacity={0.02}
            radius={3}
            y={2}
          />
          <View pointerEvents="none" style={styles.periodBackground}>
            <LinearGradient colors={LIGHT_BADGE_FILL} style={StyleSheet.absoluteFill} />
          </View>
        </>
      )}

      <Text align="center" color="labelTertiary" size="13pt" weight="bold">
        {period}
      </Text>
      <Border borderRadius={8} borderWidth={THICK_BORDER_WIDTH} borderColor={{ custom: white(isDarkMode ? 0.06 : 1) }} enableInLightMode />
    </View>
  );
});

// ============ Game Rows ====================================================== //

const GameRowIdentity = memo(function GameRowIdentity({
  isDarkMode,
  identity,
  sportId,
}: {
  isDarkMode: boolean;
  identity: Participant | 'draw';
  sportId?: string;
}): ReactElement {
  const draw = identity === 'draw';
  const name = draw ? i18n.t(i18n.l.sports.draw) : identity.name;
  const shortName = draw ? undefined : identity.shortName;
  const compact = sportId === 'tennis' || sportId === 'esports';
  const imageSize = sportId === 'tennis' ? 24 : sportId === 'esports' ? 32 : 36;
  const hasPrefix = shortName && name.endsWith(` ${shortName}`);
  const subtitle = hasPrefix ? name.slice(0, -shortName.length).trim() : undefined;

  return (
    <>
      <View style={[styles.logo, compact ? styles.compactLogo : undefined]}>
        {draw ? (
          <DrawIcon isDarkMode={isDarkMode} />
        ) : (
          <SportsImage
            isDarkMode={isDarkMode}
            imageUrl={identity.imageUrl}
            name={name}
            size={imageSize}
            width={sportId === 'tennis' ? 24 : compact ? 28 : 42}
          />
        )}
      </View>

      <View style={styles.name}>
        {subtitle ? (
          <Text color="labelTertiary" size="13pt" weight="bold" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        <Text color={draw ? 'labelSecondary' : 'label'} size="17pt" weight="bold" numberOfLines={subtitle ? 1 : 2}>
          {hasPrefix ? shortName : name}
        </Text>
      </View>
    </>
  );
});

const ParticipantBetButtons = memo(function ParticipantBetButtons({
  isDarkMode,
  gameId,
  participantIndex,
  spread,
  winner,
  color,
  onPress,
}: {
  gameId: string;
  participantIndex: 0 | 1;
  spread?: Spread;
  winner?: Selection;
  color?: string;
  isDarkMode: boolean;
  onPress: SportsGamePress;
}): ReactElement {
  const outcome = spread?.outcomes[participantIndex];

  return (
    <View style={styles.betButtons}>
      {spread && outcome ? (
        <BetButton
          isDarkMode={isDarkMode}
          key={outcome.tokenId}
          liveTokenId={getPolymarketTokenId(outcome.tokenId, 'midpoint')}
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
      ) : null}

      {winner ? (
        <BetButton
          isDarkMode={isDarkMode}
          key={winner.tokenId}
          liveTokenId={getPolymarketTokenId(winner.tokenId, 'midpoint')}
          color={color}
          onPress={outcomeColor => onPress(gameId, { selection: winner, outcomeColor })}
        />
      ) : (
        <View style={styles.unavailable}>
          <Text color="labelQuaternary" size="17pt" weight="heavy">
            —
          </Text>
        </View>
      )}
    </View>
  );
});

const GameDrawRow = memo(function GameDrawRow({
  isDarkMode,
  gameId,
  sportId,
  selection,
  onPress,
}: {
  gameId: string;
  sportId?: string;
  selection?: Selection;
  isDarkMode: boolean;
  onPress: SportsGamePress;
}): ReactElement {
  return (
    <View style={styles.row}>
      <View style={styles.participant}>
        <GameRowIdentity identity="draw" sportId={sportId} isDarkMode={isDarkMode} />
      </View>
      {selection ? (
        <BetButton
          isDarkMode={isDarkMode}
          key={selection.tokenId}
          liveTokenId={getPolymarketTokenId(selection.tokenId, 'midpoint')}
          color={isDarkMode ? globalColors.blueGrey90 : globalColors.blueGrey70}
          onPress={outcomeColor => onPress(gameId, { selection, outcomeColor })}
        />
      ) : null}
    </View>
  );
});

function DrawIcon({ isDarkMode }: { isDarkMode: boolean }): ReactElement {
  const backgroundColor = isDarkMode ? foregroundColors.fillTertiary.dark : globalColors.white100;

  return (
    <View style={[styles.drawIconCorners, isDarkMode ? undefined : badgeShadows.soft]}>
      <View style={[styles.drawIcon, styles.drawIconCorners, { backgroundColor }, isDarkMode ? undefined : badgeShadows.tight]}>
        <TextIcon color={isDarkMode ? 'labelQuaternary' : 'labelTertiary'} size="icon 17px" weight="semibold">
          {'􀆄'}
        </TextIcon>
        {isDarkMode ? <Border borderRadius={10} borderWidth={THICK_BORDER_WIDTH} borderColor="separatorSecondary" /> : null}
      </View>
    </View>
  );
}

// ============ Utilities ====================================================== //

function formatStartTime(value: string, currentDay: string): string {
  const date = new Date(value);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return date.toDateString() === currentDay ? time : `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  surface: {
    paddingBottom: 6,
    borderRadius: CARD_BORDER_RADIUS,
    borderCurve: 'continuous',
    elevation: 6,
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_BORDER_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
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
  lightPeriod: { elevation: 4 },
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
  betButtons: {
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
  drawIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  drawIconCorners: { borderRadius: 10, borderCurve: 'continuous' },
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
  skeletonBetButton: {
    width: 60,
    height: 40,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
});
