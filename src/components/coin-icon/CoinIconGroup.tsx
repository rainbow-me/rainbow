import React, { useMemo } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { View } from 'react-primitives';
import { Column, Row } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinIcon' was resolved to '/Users/nickby... Remove this comment to see the full error message
import CoinIcon from './CoinIcon';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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

const TokenRowsComponent = ({ tokenRows, iconSize, width }: any) =>
  tokenRows.map((setOfTokens: any, lineIndex: any) => (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Row key={`coinLine_${lineIndex}`}>
      {setOfTokens.map((token: any, index: any) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <View key={`coin_${index}_${lineIndex}`} width={width} zIndex={-index}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CoinIcon
            address={token?.address}
            size={iconSize}
            symbol={token?.symbol}
          />
        </View>
      ))}
    </Row>
  ));

function CoinIconGroup({ tokens }: any) {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column
      align={breakIndex ? 'center' : 'start'}
      // shouldRasterizeIOS fixes a strange framerate choppiness we see in the
      // pools list on iOS only. Appears to be the amount of coinIcons onscreen at once.
      shouldRasterizeIOS
      width={70}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TokenRowsComponent
        iconSize={iconSize}
        tokenRows={tokenRows}
        width={width}
      />
    </Column>
  );
}

export default neverRerender(CoinIconGroup);
