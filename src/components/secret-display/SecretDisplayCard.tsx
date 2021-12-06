import { times } from 'lodash';
import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import CopyTooltip from '../copy-tooltip';
import { Centered, ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletType... Remove this comment to see the full error message
import WalletTypes from '@rainbow-me/helpers/walletTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const CardBorderRadius = 25;

const BackgroundGradient = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: colors.gradients.offWhite,
    end: { x: 0.5, y: 1 },
    start: { x: 0.5, y: 0 },
  })
)`
  ${position.cover};
  border-radius: ${CardBorderRadius};
`;

const CardShadow = styled(ShadowStack).attrs(
  ({ theme: { colors, isDarkMode } }) => ({
    ...position.coverAsObject,
    backgroundColor: isDarkMode ? colors.offWhite80 : colors.white,
    borderRadius: CardBorderRadius,
    shadows: [
      [0, 10, 30, colors.shadow, 0.1],
      [0, 5, 15, colors.shadow, 0.04],
    ],
  })
)`
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

function SeedWordGrid({ seed }: any) {
  const columns = useMemo(() => {
    const words = seed.split(' ');
    return [words.slice(0, words.length / 2), words.slice(words.length / 2)];
  }, [seed]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RowWithMargins margin={24}>
      {columns.map((wordColumn, colIndex) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <RowWithMargins key={wordColumn.join('')} margin={6}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ColumnWithMargins margin={9}>
            {times(wordColumn.length, index => {
              const number = Number(index + 1 + colIndex * wordColumn.length);
              return (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <GridItem justify="end" key={`grid_number_${number}`}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ColumnWithMargins margin={9}>
            {wordColumn.map((word: any, index: any) => (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <GridItem key={`${word}${index}`}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <GridText weight="bold">{word}</GridText>
              </GridItem>
            ))}
          </ColumnWithMargins>
        </RowWithMargins>
      ))}
    </RowWithMargins>
  );
}

export default function SecretDisplayCard({ seed, type }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CardShadow />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BackgroundGradient />
        </>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CopyTooltip textToCopy={seed} tooltipText="Copy to clipboard">
          {seed && type === WalletTypes.mnemonic && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <SeedWordGrid seed={seed} />
          )}
          {seed && type === WalletTypes.privateKey && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <GridText align="center">{seed}</GridText>
          )}
        </CopyTooltip>
      </Content>
    </Centered>
  );
}
