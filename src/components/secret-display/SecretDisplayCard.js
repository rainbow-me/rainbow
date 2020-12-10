import { times } from 'lodash';
import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components/primitives';
import CopyTooltip from '../copy-tooltip';
import { Centered, ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { colors, fonts, padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const CardBorderRadius = 25;

const BackgroundGradient = styled(LinearGradient).attrs({
  colors: colors.gradients.offWhite,
  end: { x: 0.5, y: 1 },
  start: { x: 0.5, y: 0 },
})`
  ${position.cover};
  border-radius: ${CardBorderRadius};
`;

const CardShadow = styled(ShadowStack).attrs({
  ...position.coverAsObject,
  borderRadius: CardBorderRadius,
  shadows: [
    [0, 10, 30, colors.dark, 0.1],
    [0, 5, 15, colors.dark, 0.04],
  ],
})`
  elevation: 15;
`;

const Content = styled(Centered)`
  ${padding(19, 30, 24)};
  border-radius: 25;
  overflow: hidden;
  z-index: 1;
`;

const GridItem = styled(Row).attrs({
  align: 'center',
})`
  height: ${fonts.lineHeight.looser};
`;

const GridText = styled(Text).attrs(({ weight = 'semibold' }) => ({
  lineHeight: 'looser',
  size: 'lmedium',
  weight,
}))``;

function SeedWordGrid({ seed }) {
  const columns = useMemo(() => {
    const words = seed.split(' ');
    return [words.slice(0, words.length / 2), words.slice(words.length / 2)];
  }, [seed]);

  return (
    <RowWithMargins margin={24}>
      {columns.map((wordColumn, colIndex) => (
        <RowWithMargins key={wordColumn.join('')} margin={6}>
          <ColumnWithMargins margin={9}>
            {times(wordColumn.length, index => {
              const number = Number(index + 1 + colIndex * wordColumn.length);
              return (
                <GridItem justify="end" key={`grid_number_${number}`}>
                  <GridText
                    align="right"
                    color={colors.alpha(colors.appleBlue, 0.6)}
                  >
                    {number}
                  </GridText>
                </GridItem>
              );
            })}
          </ColumnWithMargins>
          <ColumnWithMargins margin={9}>
            {wordColumn.map((word, index) => (
              <GridItem key={`${word}${index}`}>
                <GridText weight="bold">{word}</GridText>
              </GridItem>
            ))}
          </ColumnWithMargins>
        </RowWithMargins>
      ))}
    </RowWithMargins>
  );
}

export default function SecretDisplayCard({ seed, type }) {
  return (
    <Centered>
      {ios && (
        <>
          <CardShadow />
          <BackgroundGradient />
        </>
      )}
      <Content>
        <CopyTooltip textToCopy={seed} tooltipText="Copy to clipboard">
          {seed && type === WalletTypes.mnemonic && (
            <SeedWordGrid seed={seed} />
          )}
          {seed && type === WalletTypes.privateKey && (
            <GridText align="center">{seed}</GridText>
          )}
        </CopyTooltip>
      </Content>
    </Centered>
  );
}
