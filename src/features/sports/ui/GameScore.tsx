import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { deepEqual } from '@storesjs/stores';

import { Text } from '@/design-system/components/Text/Text';
import { ScoreColumn_Kind, ScoreColumn_Winner } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';

export const GameScore = memo(function GameScore({ gameId, participantIndex }: { gameId: string; participantIndex: 0 | 1 }) {
  const score = useSportsStore(state => state.games[gameId]?.score, deepEqual);
  if (!score?.length) return null;

  const otherWinner = participantIndex === 0 ? ScoreColumn_Winner.WINNER_SECOND : ScoreColumn_Winner.WINNER_FIRST;

  return (
    <View style={styles.columns}>
      {score.map((column, index) => {
        const value = participantIndex === 0 ? column.first : column.second;
        const wide = column.kind === ScoreColumn_Kind.KIND_ROUNDS || column.kind === ScoreColumn_Kind.KIND_SERIES;
        return (
          <View key={index} style={[styles.column, wide && styles.wideColumn, column.winner === otherWinner && styles.lost]}>
            <Text align="center" color="label" numberOfLines={1} size="17pt" tabularNumbers weight="heavy">
              {value?.value}
            </Text>
            {value?.tieBreak !== undefined && (
              <View style={styles.tieBreak}>
                <Text color="label" size="11pt" tabularNumbers weight="heavy">
                  {value.tieBreak}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  column: { minWidth: 16 },
  wideColumn: { minWidth: 24 },
  lost: { opacity: 0.4 },
  tieBreak: { position: 'absolute', right: -8, top: -5 },
});
