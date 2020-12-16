import React, { useMemo } from 'react';
import { View } from 'react-primitives';
import { Column, Row } from '../layout';
import CoinIcon from './CoinIcon';

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

export default function CoinIconGroup({ tokens }) {
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
    <Column align={breakIndex ? 'center' : 'start'} width={70}>
      {tokenRows.map((setOfTokens, lineIndex) => (
        <Row key={`coinLine_${lineIndex}`}>
          {setOfTokens.map((token, index) => (
            <View
              key={`coin_${index}_${lineIndex}`}
              width={width}
              zIndex={-index}
            >
              <CoinIcon
                address={token?.address}
                size={iconSize}
                symbol={token?.symbol}
              />
            </View>
          ))}
        </Row>
      ))}
    </Column>
  );
}
