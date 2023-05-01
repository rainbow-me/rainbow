import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { ColumnWithMargins, Row, RowWithMargins } from '@/components/layout';
import { times } from '@/helpers/utilities';
import { fonts } from '@/styles';
import { Text } from '@/components/text';

interface Props {
  seed: string;
}

export function SeedWordGrid({ seed }: Props) {
  const columns = useMemo(() => {
    const words = seed.split(' ');
    return [words.slice(0, words.length / 2), words.slice(words.length / 2)];
  }, [seed]);

  const { colors } = useTheme();

  return (
    <RowWithMargins margin={24}>
      {columns.map((wordColumn, colIndex) => (
        <RowWithMargins key={wordColumn.join('')} margin={6}>
          <ColumnWithMargins margin={9}>
            {times(wordColumn.length, index => {
              const number = Number(index + 1 + colIndex * wordColumn.length);
              return (
                <Row
                  style={styles.gridItem}
                  align="center"
                  justify="end"
                  key={`grid_number_${number}`}
                >
                  <Text
                    lineHeight="looser"
                    size="lmedium"
                    weight="semibold"
                    align="right"
                    color={colors.alpha(colors.appleBlue, 0.6)}
                  >
                    {number}
                  </Text>
                </Row>
              );
            })}
          </ColumnWithMargins>
          <ColumnWithMargins margin={9}>
            {wordColumn.map((word, index) => (
              <Row
                style={styles.gridItem}
                align="center"
                key={`${word}${index}`}
              >
                <Text size="lmedium" lineHeight="looser" weight="bold">
                  {word}
                </Text>
              </Row>
            ))}
          </ColumnWithMargins>
        </RowWithMargins>
      ))}
    </RowWithMargins>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    height: fonts.lineHeight.looser,
  },
});
