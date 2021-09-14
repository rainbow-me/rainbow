import React, { useMemo } from 'react';
import { View } from 'react-primitives';
import { Column, Row } from '../layout';
import CoinIcon from './CoinIcon';
import { neverRerender } from '@rainbow-me/utils';

// Note that `width` is always smaller than `iconSize`. We do this to force the
// `CoinIcon`'s to overlap each other (imagine the Olympics logo).
const sizesTable = [
  { breakIndex: false, iconSize: 40, width: 30 },
  { breakIndex: false, iconSize: 40, width: 30 },
  { breakIndex: false, iconSize: 30, width: 20 },
  { breakIndex: false, iconSize: 25, width: 15 },
  { breakIndex: 1, iconSize: 20, width: 15 },
  { breakIndex: 2, iconSize: 20, width: 15 },
  { breakIndex: 3, iconSize: 20, width: 15 },
  { breakIndex: 4, iconSize: 20, width: 15 },
];

const TokenRowsComponent = ({ tokenRows, iconSize, width }) =>
  tokenRows.map((setOfTokens, lineIndex) => (
    <Row key={`coinLine_${lineIndex}`}>
      {setOfTokens.map((token, index) => (
        <View key={`coin_${index}_${lineIndex}`} width={width} zIndex={-index}>
          <CoinIcon
            address={token?.address}
            size={iconSize}
            symbol={token?.symbol}
          />
        </View>
      ))}
    </Row>
  ));

function CoinIconGroup({ tokens }) {
  const { breakIndex, iconSize, width } = useMemo(
    () => sizesTable[tokens.length - 1],
    [tokens]
  );

  const tokenRows = useMemo(() => {
    return [
      tokens.slice(0, breakIndex),
      tokens.slice(breakIndex, tokens.length),
    ];
  }, [breakIndex, tokens]);

  return (
    <Column
      align={breakIndex ? 'center' : 'start'}
      // shouldRasterizeIOS fixes a strange framerate choppiness we see in the
      // pools list on iOS only. Appears to be the amount of coinIcons onscreen at once.
      shouldRasterizeIOS
      width={70}
    >
      <TokenRowsComponent
        iconSize={iconSize}
        tokenRows={tokenRows}
        width={width}
      />
    </Column>
  );
}

export default neverRerender(CoinIconGroup);
