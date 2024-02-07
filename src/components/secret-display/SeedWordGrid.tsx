import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { ColumnWithMargins, Row, RowWithMargins } from '@/components/layout';
import { times } from '@/helpers/utilities';
import { fonts } from '@/styles';
import { Box, Text, Separator } from '@/design-system';

interface Props {
  seed: string;
}

export function SeedWordGrid({ seed }: Props) {
  const columns = useMemo(() => {
    const words = seed.split(' ');
    return [words.slice(0, words.length / 2), words.slice(words.length / 2)];
  }, [seed]);

  return (
    <Row>
      {columns.map((wordColumn, colIndex) => (
        <>
          <RowWithMargins key={wordColumn.join('')} margin={6} paddingRight={26}>
            <ColumnWithMargins margin={9} style={{ paddingTop: 1 }}>
              {times(wordColumn.length, index => {
                const number = Number(index + 1 + colIndex * wordColumn.length);
                return (
                  <Row style={styles.gridItem} align="center" justify="end" key={`grid_number_${number}`}>
                    <Text color={'labelTertiary'} size="12pt" weight="medium">
                      {number < 10 ? `0${number}` : number}
                    </Text>
                  </Row>
                );
              })}
            </ColumnWithMargins>
            <ColumnWithMargins margin={9}>
              {wordColumn.map((word, index) => (
                <Row style={styles.gridItem} align="center" key={`${word}${index}`}>
                  <Text color={'label'} size="15pt" weight="medium">
                    {word}
                  </Text>
                </Row>
              ))}
            </ColumnWithMargins>
          </RowWithMargins>
          {colIndex === 0 && (
            <Box style={{ width: 20 }}>
              <Separator direction="vertical" color="separatorTertiary" thickness={1} />
            </Box>
          )}
        </>
      ))}
    </Row>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    height: fonts.lineHeight.looser,
  },
});
