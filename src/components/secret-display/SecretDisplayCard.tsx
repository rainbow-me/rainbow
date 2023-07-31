import lang from 'i18n-js';
import React, { useMemo } from 'react';
import CopyTooltip from '../copy-tooltip';
import { Centered, ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import { Box, Inset } from '@/design-system';
import { times } from '@/helpers/utilities';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import styled from '@/styled-thing';
import { fonts } from '@/styles';
import { useTheme } from '@/theme';

const GridItem = styled(Row).attrs({
  align: 'center',
})({
  height: fonts.lineHeight.looser,
});

const GridText = styled(Text).attrs(({ weight = 'semibold' }) => ({
  lineHeight: 'looser',
  size: 'lmedium',
  weight,
}))({});

interface SeedWordGridProps {
  seed: string;
}

function SeedWordGrid({ seed }: SeedWordGridProps) {
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

interface SecretDisplayCardProps {
  seed: string;
  type: EthereumWalletType;
}

export default function SecretDisplayCard({
  seed,
  type,
}: SecretDisplayCardProps) {
  return (
    <Centered>
      <Inset vertical="10px">
        <Box
          background="surfaceSecondaryElevated"
          borderRadius={25}
          height={{ custom: 240 }}
          paddingHorizontal="30px (Deprecated)"
          paddingVertical="19px (Deprecated)"
          shadow="21px light (Deprecated)"
        >
          <CopyTooltip
            textToCopy={seed}
            tooltipText={lang.t('back_up.secret.copy_to_clipboard')}
          >
            <Box alignItems="center" height="full" justifyContent="center">
              {seed && type === WalletTypes.mnemonic && (
                <SeedWordGrid seed={seed} />
              )}
              {seed && type === WalletTypes.privateKey && (
                <GridText align="center">{seed}</GridText>
              )}
            </Box>
          </CopyTooltip>
        </Box>
      </Inset>
    </Centered>
  );
}
