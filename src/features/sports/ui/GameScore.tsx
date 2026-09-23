import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/design-system/components/Text/Text';
import { ScoreColumn_Kind, ScoreColumn_Winner, type ScoreColumn } from '@/features/sports/core/generated/sports';

export const GameScore = memo(function GameScore({
  score,
  participantIndex,
}: {
  score?: ScoreColumn[];
  participantIndex: 0 | 1;
}): ReactElement | null {
  if (!score?.length) return null;

  const otherWinner = participantIndex === 0 ? ScoreColumn_Winner.WINNER_SECOND : ScoreColumn_Winner.WINNER_FIRST;

  return (
    <View style={styles.columns}>
      {score.map((column, index) => {
        const value = participantIndex === 0 ? column.first : column.second;
        const wide = column.kind === ScoreColumn_Kind.KIND_ROUNDS || column.kind === ScoreColumn_Kind.KIND_SERIES;
        const hasTieBreak = column.first?.tieBreak !== undefined || column.second?.tieBreak !== undefined;

        return (
          <View key={index} style={[styles.column, wide ? styles.wideColumn : undefined, hasTieBreak ? styles.tieBreakColumn : undefined]}>
            <Text
              align="center"
              color={column.winner === otherWinner ? 'labelQuaternary' : 'label'}
              numberOfLines={1}
              size="17pt"
              tabularNumbers
              weight="heavy"
            >
              {value?.value}
            </Text>

            {value?.tieBreak === undefined ? null : (
              <View style={styles.tieBreak}>
                <Text color={column.winner === otherWinner ? 'labelQuaternary' : 'label'} size="11pt" tabularNumbers weight="heavy">
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
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  column: { minWidth: 10 },
  wideColumn: { minWidth: 24 },
  tieBreakColumn: { minWidth: 22, paddingRight: 12 },
  tieBreak: {
    position: 'absolute',
    right: 0,
    top: -5,
  },
});
